"""
Stack service — generates and manages the shuffled user stack for swiping.
"""

import hashlib
import logging
import random
import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.swipe import Swipe
from app.models.user import User
from app.services import cache_service

logger = logging.getLogger(__name__)
settings = get_settings()


async def get_stack(
    db: AsyncSession, user_id: uuid.UUID
) -> list[dict]:
    """
    Get the shuffled stack of unseen users for a given user.

    1. Check Redis for a cached stack.
    2. If cache miss, query DB for all active users minus self and already-swiped.
    3. Shuffle using a seed (user_id + today's date) for daily consistency.
    4. Cache the result in Redis with a 24h TTL.
    """
    user_id_str = str(user_id)

    # 1. Try Redis cache
    cached = await cache_service.get_stack(user_id_str)
    if cached is not None:
        # Fetch user details for the cached IDs
        if not cached:
            return []
        cached_uuids = [uuid.UUID(uid) for uid in cached]
        result = await db.execute(
            select(User).where(
                User.id.in_(cached_uuids),
                User.is_active == True,  # noqa: E712
            )
        )
        users = result.scalars().all()
        # Preserve the Redis ordering
        user_map = {str(u.id): u for u in users}
        return [
            {
                "id": user_map[uid].id,
                "name": user_map[uid].name,
                "business_name": user_map[uid].business_name,
                "business_category": user_map[uid].business_category,
                "profile_image": user_map[uid].profile_image,
            }
            for uid in cached
            if uid in user_map
        ]

    # 2. Cache miss — build from DB
    # Get IDs of users already swiped by this user
    swiped_result = await db.execute(
        select(Swipe.swiped_id).where(Swipe.swiper_id == user_id)
    )
    swiped_ids = set(swiped_result.scalars().all())
    swiped_ids.add(user_id)  # Exclude self

    # Get all active, non-swiped users
    result = await db.execute(
        select(User).where(
            User.is_active == True,  # noqa: E712
            User.id.notin_(swiped_ids),
        )
    )
    users = result.scalars().all()

    # 3. Shuffle with daily seed
    seed_str = f"{user_id_str}:{date.today().isoformat()}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    rng.shuffle(users)

    # 4. Cache in Redis
    stack_ids = [str(u.id) for u in users]
    await cache_service.set_stack(user_id_str, stack_ids, ttl_hours=settings.STACK_TTL_HOURS)

    logger.info(f"Built stack of {len(users)} users for user {user_id_str[-8:]}")

    return [
        {
            "id": u.id,
            "name": u.name,
            "business_name": u.business_name,
            "business_category": u.business_category,
            "profile_image": u.profile_image,
        }
        for u in users
    ]
