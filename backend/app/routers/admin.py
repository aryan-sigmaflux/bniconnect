"""
Admin routes — member CRUD and swipe data reset.
"""

import logging
import os
import shutil
import csv
import io
import zipfile
import tempfile
from pathlib import Path
from typing import Annotated

from rapidfuzz import fuzz, process

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth_middleware import require_admin
from app.models.match import Match
from app.models.swipe import Swipe
from app.models.user import User
from app.schemas.user import (
    AdminMemberCreate,
    AdminMemberResponse,
    AdminMemberUpdate,
    MemberSwipeDetail,
    MemberSwipeStats,
    SwipedUserInfo,
)
from app.services import cache_service
from app.utils.helpers import ensure_upload_dirs, get_upload_path, normalize_phone

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/members", response_model=list[AdminMemberResponse])
async def list_members(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all members (active and inactive)."""
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [AdminMemberResponse.model_validate(u) for u in users]


@router.get("/members/swipe-stats", response_model=list[MemberSwipeStats])
async def member_swipe_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return every active member with their liked / rejected counts."""
    from sqlalchemy.orm import aliased
    from app.models.swipe import SwipeDirection

    # Sub-queries for liked and rejected counts per swiper
    liked_sub = (
        select(
            Swipe.swiper_id,
            func.count().label("liked_count"),
        )
        .where(Swipe.direction == SwipeDirection.LIKE)
        .group_by(Swipe.swiper_id)
        .subquery()
    )
    rejected_sub = (
        select(
            Swipe.swiper_id,
            func.count().label("rejected_count"),
        )
        .where(Swipe.direction == SwipeDirection.REJECT)
        .group_by(Swipe.swiper_id)
        .subquery()
    )

    stmt = (
        select(
            User.id,
            User.name,
            User.profile_image,
            func.coalesce(liked_sub.c.liked_count, 0).label("liked_count"),
            func.coalesce(rejected_sub.c.rejected_count, 0).label("rejected_count"),
        )
        .outerjoin(liked_sub, User.id == liked_sub.c.swiper_id)
        .outerjoin(rejected_sub, User.id == rejected_sub.c.swiper_id)
        .where(User.is_active == True)
        .order_by(User.name)
    )

    result = await db.execute(stmt)
    rows = result.all()
    return [
        MemberSwipeStats(
            id=r.id,
            name=r.name,
            profile_image=r.profile_image,
            liked_count=r.liked_count,
            rejected_count=r.rejected_count,
        )
        for r in rows
    ]


@router.get("/members/{member_id}/swipe-details", response_model=MemberSwipeDetail)
async def member_swipe_details(
    member_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return the full swipe breakdown for a specific member."""
    import uuid as _uuid
    from app.models.swipe import SwipeDirection

    uid = _uuid.UUID(member_id)

    # Fetch the member
    result = await db.execute(select(User).where(User.id == uid))
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    # Fetch all swipes by this member
    swipes_result = await db.execute(
        select(Swipe).where(Swipe.swiper_id == uid)
    )
    swipes = swipes_result.scalars().all()

    liked_ids = {s.swiped_id for s in swipes if s.direction == SwipeDirection.LIKE}
    rejected_ids = {s.swiped_id for s in swipes if s.direction == SwipeDirection.REJECT}
    swiped_ids = liked_ids | rejected_ids

    # Fetch all other active users
    all_result = await db.execute(
        select(User).where(User.is_active == True, User.id != uid)
    )
    all_users = all_result.scalars().all()

    def to_info(u: User) -> SwipedUserInfo:
        return SwipedUserInfo(
            id=u.id,
            name=u.name,
            profile_image=u.profile_image,
            business_name=u.business_name,
        )

    liked = [to_info(u) for u in all_users if u.id in liked_ids]
    rejected = [to_info(u) for u in all_users if u.id in rejected_ids]
    not_swiped = [to_info(u) for u in all_users if u.id not in swiped_ids]

    return MemberSwipeDetail(
        member=to_info(member),
        liked=liked,
        rejected=rejected,
        not_swiped=not_swiped,
    )


@router.post("/members", response_model=AdminMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    body: AdminMemberCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add a new member."""
    phone = normalize_phone(body.phone)
    
    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == phone))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with this phone number already exists",
        )

    admin_numbers = [p.strip() for p in settings.ADMIN_NUMBER.split(",") if p.strip()]
    is_admin = phone in admin_numbers
    user = User(
        phone=phone,
        name=body.name,
        business_name=body.business_name,
        business_category=body.business_category,
        description=body.description,
        is_admin=is_admin,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    await db.commit()

    logger.info(f"Admin created member: {user.name} ({user.phone[-4:]})")
    return AdminMemberResponse.model_validate(user)


@router.post("/members/bulk")
async def bulk_add_members(
    file: Annotated[UploadFile, File(...)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Bulk add members via CSV."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV",
        )
    
    contents = await file.read()
    try:
        text = contents.decode("utf-8-sig") # handles BOM if present
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must be UTF-8 encoded",
        )
        
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV is empty or invalid")
    
    headers = [h.strip().lower() for h in reader.fieldnames]
    reader.fieldnames = headers
    
    if "name" not in headers or "number" not in headers:
        raise HTTPException(status_code=400, detail="CSV must contain 'name' and 'number' columns")
        
    added = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        name = row.get("name", "").strip()
        phone = row.get("number", "").strip()
        business_name = row.get("business name", "") or row.get("business_name", "")
        business_name = business_name.strip()
        business_category = row.get("business category", "") or row.get("business_category", "")
        business_category = business_category.strip()
        description = row.get("description", "").strip()
        
        if not name or not phone:
            errors.append(f"Row {row_num}: Missing name or number")
            continue
        
        # Normalize phone
        phone = normalize_phone(phone)
            
        # Check if phone exists
        existing = await db.execute(select(User).where(User.phone == phone))
        if existing.scalar_one_or_none() is not None:
            errors.append(f"Row {row_num}: Phone {phone} already exists")
            continue
            
        admin_numbers = [p.strip() for p in settings.ADMIN_NUMBER.split(",") if p.strip()]
        is_admin = phone in admin_numbers
        user = User(
            phone=phone,
            name=name,
            business_name=business_name if business_name else None,
            business_category=business_category if business_category else None,
            description=description if description else None,
            is_admin=is_admin,
        )
        db.add(user)
        added += 1
        
    await db.commit()
    return {"message": f"Successfully added {added} members.", "errors": errors}


@router.post("/members/{member_id}/image", response_model=AdminMemberResponse)
async def upload_member_image(
    member_id: str,
    file: Annotated[UploadFile, File(...)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Upload or replace a member's profile image."""
    import uuid as _uuid

    result = await db.execute(select(User).where(User.id == _uuid.UUID(member_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Validate file
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    contents = await file.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image must be under {settings.MAX_IMAGE_SIZE_MB}MB",
        )

    # Save file
    ensure_upload_dirs()
    rel_path = get_upload_path(file.filename or "image.jpg")
    full_path = Path(settings.UPLOAD_DIR) / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)

    with open(full_path, "wb") as f:
        f.write(contents)

    # Delete old image if exists
    if user.profile_image:
        old_path = Path(settings.UPLOAD_DIR) / user.profile_image
        if old_path.exists():
            old_path.unlink(missing_ok=True)

    user.profile_image = rel_path
    await db.flush()
    await db.commit()
    await db.refresh(user)

    return AdminMemberResponse.model_validate(user)


@router.post("/members/bulk-images")
async def bulk_upload_images(
    file: Annotated[UploadFile, File(...)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Bulk map images to members from a ZIP file using fuzzy matching on names."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a ZIP archive",
        )

    # Fetch all users
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()
    if not users:
        raise HTTPException(status_code=400, detail="No active members found")

    # Create a mapping of normalized names to users
    user_choices = {u.id: u.name.lower().replace(" ", "") for u in users}

    successful = []
    failed = []

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = Path(tmpdir) / "upload.zip"
        contents = await file.read()
        with open(zip_path, "wb") as f:
            f.write(contents)

        try:
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmpdir)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file")

        ensure_upload_dirs()

        for root, _, files in os.walk(tmpdir):
            for filename in files:
                if filename == "upload.zip" or filename.startswith(".") or "__MACOSX" in root:
                    continue

                filepath = Path(root) / filename
                ext = filepath.suffix.lower()
                
                if ext not in (".jpg", ".jpeg", ".png", ".webp"):
                    failed.append(f"{filename}: Not a valid image format")
                    continue

                # Max size check per image (e.g. 5MB)
                if filepath.stat().st_size > 5 * 1024 * 1024:
                    failed.append(f"{filename}: File size exceeds 5MB")
                    continue

                base_name = filepath.stem.lower().replace(" ", "")
                
                # Fuzzy match
                best_match = None
                best_score = 0
                for uid, uname in user_choices.items():
                    score = fuzz.ratio(base_name, uname)
                    if score > best_score:
                        best_score = score
                        best_match = uid

                # Threshold for matching
                if best_score < 80 or not best_match:
                    failed.append(f"{filename}: No close match found (Best score: {best_score})")
                    continue

                # Find the matched user
                matched_user = next((u for u in users if u.id == best_match), None)
                if not matched_user:
                    failed.append(f"{filename}: User not found after matching")
                    continue

                # Save image
                rel_path = get_upload_path(filename)
                full_path = Path(settings.UPLOAD_DIR) / rel_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                
                shutil.copy2(filepath, full_path)
                
                # Delete old image if exists
                if matched_user.profile_image:
                    old_path = Path(settings.UPLOAD_DIR) / matched_user.profile_image
                    if old_path.exists():
                        old_path.unlink(missing_ok=True)
                        
                matched_user.profile_image = rel_path
                successful.append(f"{filename} -> {matched_user.name}")

    await db.flush()
    await db.commit()

    return {
        "message": f"Processed {len(successful)} images successfully.",
        "successful": successful,
        "failed": failed,
    }


@router.put("/members/{member_id}", response_model=AdminMemberResponse)
async def update_member(
    member_id: str,
    body: AdminMemberUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update member details."""
    import uuid as _uuid

    result = await db.execute(select(User).where(User.id == _uuid.UUID(member_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.flush()
    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin updated member {member_id}: {update_data}")
    return AdminMemberResponse.model_validate(user)


@router.delete("/members/{member_id}")
async def delete_member(
    member_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft-delete a member (set is_active = false)."""
    import uuid as _uuid

    result = await db.execute(select(User).where(User.id == _uuid.UUID(member_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    user.is_active = False
    await db.flush()

    # Remove from all liked_me caches
    await cache_service.remove_user_from_liked_me(str(user.id))

    await db.commit()

    logger.info(f"Admin soft-deleted member {user.name} ({member_id})")
    return {"message": f"Member {user.name} has been deactivated"}


@router.post("/reset")
async def reset_all_swipes(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Hard reset — truncate swipes and matches tables, flush Redis caches.
    This is irreversible.
    """
    # Delete all swipes
    await db.execute(delete(Swipe))
    # Delete all matches
    await db.execute(delete(Match))
    await db.flush()

    # Flush Redis
    await cache_service.flush_all_stacks_and_likes()

    await db.commit()

    logger.warning("Admin performed full swipe data reset")
    return {"message": "All swipe data has been reset"}
