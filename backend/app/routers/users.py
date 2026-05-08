"""
User routes — stack retrieval, profile, and liked-me cache.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.user import UserCard, UserProfile, UserStackResponse
from app.services import stack_service, swipe_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/stack", response_model=UserStackResponse)
async def get_swipe_stack(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get the shuffled stack of unseen users for swiping.
    Stack is cached in Redis for 24 hours with daily-seed shuffling.
    """
    stack = await stack_service.get_stack(db, current_user.id)
    return UserStackResponse(
        stack=[UserCard(**u) for u in stack],
        total=len(stack),
    )


@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return the current authenticated user's profile."""
    return UserProfile.model_validate(current_user)


@router.get("/liked-me-cache", response_model=list[str])
async def get_liked_me_cache(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns all user IDs that have liked the current user (from Redis cache).
    Frontend uses this for optimistic match animation.
    """
    ids = await swipe_service.get_liked_me_ids(current_user.id)
    return ids
