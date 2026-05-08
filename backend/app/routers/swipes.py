"""
Swipe routes — record swipes, get sent likes, get matches.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.swipe import (
    MatchItem,
    MatchListResponse,
    SentSwipeItem,
    SentSwipeListResponse,
    SwipeRequest,
    SwipeResponse,
)
from app.schemas.user import UserCard
from app.services import swipe_service, whatsapp_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/swipes", tags=["Swipes"])


@router.post("", response_model=SwipeResponse)
async def record_swipe(
    body: SwipeRequest,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Record a swipe (like or reject).
    If a mutual like is detected, a match is created and
    the other user is notified via WhatsApp in the background.
    """
    if body.swiped_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot swipe on yourself",
        )

    # Verify target user exists and is active
    result = await db.execute(
        select(User).where(User.id == body.swiped_id, User.is_active == True)  # noqa: E712
    )
    target_user = result.scalar_one_or_none()
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or inactive",
        )

    try:
        swipe_result = await swipe_service.record_swipe(
            db=db,
            swiper_id=current_user.id,
            swiped_id=body.swiped_id,
            direction=body.direction.value,
        )
    except Exception as e:
        if "uq_swiper_swiped" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already swiped on this user",
            )
        raise

    await db.commit()

    # If matched, send WhatsApp notification in background
    if swipe_result["matched"]:
        background_tasks.add_task(
            whatsapp_service.send_match_notification,
            target_user.phone,
            target_user.name,
            current_user.name,
            current_user.phone,
        )

    matched_user = None
    if swipe_result["matched_user"]:
        matched_user = UserCard(**swipe_result["matched_user"])

    return SwipeResponse(matched=swipe_result["matched"], matched_user=matched_user)


@router.get("/sent", response_model=SentSwipeListResponse)
async def get_sent_likes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all users that the current user has liked."""
    sent = await swipe_service.get_sent_likes(db, current_user.id)
    return SentSwipeListResponse(
        sent=[
            SentSwipeItem(
                user=UserCard(**s["user"]),
                swiped_at=s["swiped_at"],
            )
            for s in sent
        ],
        total=len(sent),
    )


@router.get("/matches", response_model=MatchListResponse)
async def get_matches(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all mutual matches for the current user."""
    matches = await swipe_service.get_matches(db, current_user.id)
    return MatchListResponse(
        matches=[
            MatchItem(
                user=UserCard(**m["user"]),
                matched_at=m["matched_at"],
            )
            for m in matches
        ],
        total=len(matches),
    )
