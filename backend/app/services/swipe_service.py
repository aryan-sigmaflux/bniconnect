"""
Swipe service — handles swipe recording, match detection, and match queries.
"""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.match import Match
from app.models.swipe import Swipe, SwipeDirection
from app.models.user import User
from app.services import cache_service

logger = logging.getLogger(__name__)


async def record_swipe(
    db: AsyncSession,
    swiper_id: uuid.UUID,
    swiped_id: uuid.UUID,
    direction: str,
) -> dict:
    """
    Record a swipe and detect matches.

    Returns: { "matched": bool, "matched_user": UserCard | None }
    """
    # Insert the swipe
    swipe = Swipe(
        swiper_id=swiper_id,
        swiped_id=swiped_id,
        direction=SwipeDirection(direction),
    )
    db.add(swipe)
    await db.flush()

    # Remove from Redis stack
    await cache_service.remove_from_stack(str(swiper_id), str(swiped_id))

    matched = False
    matched_user = None

    if direction == "like":
        # 1. Add to liked_me cache: swiped_id now knows swiper_id liked them
        await cache_service.add_liked_me(str(swiped_id), str(swiper_id))

        # 2. Fast Redis check if reverse like exists (handles concurrent likes perfectly)
        has_liked_us = await cache_service.has_liked_me(str(swiper_id), str(swiped_id))

        if has_liked_us:
            # MATCH DETECTED
            matched = True

            # Insert match with ordered IDs (a < b)
            a, b = sorted([swiper_id, swiped_id])
            
            # Use raw insert with ON CONFLICT DO NOTHING to handle concurrent matches gracefully
            from sqlalchemy.dialects.postgresql import insert
            
            stmt = insert(Match).values(
                user_a_id=a,
                user_b_id=b,
                matched_at=datetime.now(timezone.utc),
            ).on_conflict_do_nothing(index_elements=['user_a_id', 'user_b_id'])
            
            await db.execute(stmt)
            await db.flush()

            # Fetch the matched user's profile
            result = await db.execute(
                select(User).where(User.id == swiped_id)
            )
            matched_user_obj = result.scalar_one_or_none()
            if matched_user_obj:
                matched_user = {
                    "id": matched_user_obj.id,
                    "name": matched_user_obj.name,
                    "business_name": matched_user_obj.business_name,
                    "business_category": matched_user_obj.business_category,
                    "description": matched_user_obj.description,
                    "profile_image": matched_user_obj.profile_image,
                }

            logger.info(
                f"Match detected: {str(swiper_id)[-8:]} ↔ {str(swiped_id)[-8:]}"
            )

    return {"matched": matched, "matched_user": matched_user}


async def get_sent_likes(
    db: AsyncSession, user_id: uuid.UUID
) -> list[dict]:
    """Get all users that the current user has liked."""
    # Subquery for all matches involving this user
    matches_sub = select(Match.user_a_id).where(Match.user_b_id == user_id).union(
        select(Match.user_b_id).where(Match.user_a_id == user_id)
    )

    result = await db.execute(
        select(Swipe, User)
        .join(User, Swipe.swiped_id == User.id)
        .where(
            Swipe.swiper_id == user_id,
            Swipe.direction == SwipeDirection.LIKE,
            ~Swipe.swiped_id.in_(matches_sub)
        )
        .order_by(Swipe.created_at.desc())
    )
    rows = result.all()

    return [
        {
            "user": {
                "id": user.id,
                "name": user.name,
                "business_name": user.business_name,
                "business_category": user.business_category,
                "description": user.description,
                "profile_image": user.profile_image,
            },
            "swiped_at": swipe.created_at,
        }
        for swipe, user in rows
    ]


async def get_matches(
    db: AsyncSession, user_id: uuid.UUID
) -> list[dict]:
    """Get all mutual matches for a user."""
    result = await db.execute(
        select(Match)
        .where(
            or_(
                Match.user_a_id == user_id,
                Match.user_b_id == user_id,
            )
        )
        .order_by(Match.matched_at.desc())
    )
    matches = result.scalars().all()

    match_list = []
    for m in matches:
        # The other user in the match
        other_id = m.user_b_id if m.user_a_id == user_id else m.user_a_id
        user_result = await db.execute(select(User).where(User.id == other_id))
        other_user = user_result.scalar_one_or_none()
        if other_user:
            match_list.append(
                {
                    "user": {
                        "id": other_user.id,
                        "name": other_user.name,
                        "business_name": other_user.business_name,
                        "business_category": other_user.business_category,
                        "description": other_user.description,
                        "profile_image": other_user.profile_image,
                    },
                    "matched_at": m.matched_at,
                }
            )

    return match_list


async def get_liked_me_ids(user_id: uuid.UUID) -> list[str]:
    """Get user IDs of people who liked the current user (from Redis cache)."""
    return list(await cache_service.get_liked_me(str(user_id)))
