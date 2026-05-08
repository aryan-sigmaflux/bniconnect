"""
Admin routes — member CRUD and swipe data reset.
"""

import logging
import os
import shutil
import csv
import io
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select, delete
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
)
from app.services import cache_service
from app.utils.helpers import ensure_upload_dirs, get_upload_path

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


@router.post("/members", response_model=AdminMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    body: AdminMemberCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add a new member."""
    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == body.phone))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with this phone number already exists",
        )

    is_admin = body.phone == settings.ADMIN_NUMBER
    user = User(
        phone=body.phone,
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
            
        # Check if phone exists
        existing = await db.execute(select(User).where(User.phone == phone))
        if existing.scalar_one_or_none() is not None:
            errors.append(f"Row {row_num}: Phone {phone} already exists")
            continue
            
        is_admin = phone == settings.ADMIN_NUMBER
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
