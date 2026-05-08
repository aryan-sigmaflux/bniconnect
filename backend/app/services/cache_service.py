"""
Redis cache helpers for stack and liked_me sets.
"""

import logging
from typing import Optional

import redis.asyncio as redis

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_redis_pool: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get or create the Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
    return _redis_pool


async def close_redis() -> None:
    """Close the Redis connection pool."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None


# ── Stack helpers ──


async def set_stack(user_id: str, user_ids: list[str], ttl_hours: int = 24) -> None:
    """Store the shuffled stack for a user as a Redis list."""
    r = await get_redis()
    key = f"stack:{user_id}"
    pipe = r.pipeline()
    await pipe.delete(key)
    if user_ids:
        await pipe.rpush(key, *user_ids)
    await pipe.expire(key, ttl_hours * 3600)
    await pipe.execute()


async def get_stack(user_id: str) -> list[str] | None:
    """Retrieve the full stack list from Redis. Returns None if key doesn't exist."""
    r = await get_redis()
    key = f"stack:{user_id}"
    exists = await r.exists(key)
    if not exists:
        return None
    return await r.lrange(key, 0, -1)


async def remove_from_stack(user_id: str, swiped_id: str) -> None:
    """Remove a swiped user from the stack list."""
    r = await get_redis()
    key = f"stack:{user_id}"
    await r.lrem(key, 0, swiped_id)


# ── Liked-me set helpers ──


async def add_liked_me(target_user_id: str, liker_user_id: str) -> None:
    """Record that liker_user_id has liked target_user_id."""
    r = await get_redis()
    key = f"liked_me:{target_user_id}"
    await r.sadd(key, liker_user_id)


async def get_liked_me(user_id: str) -> set[str]:
    """Get all user IDs that have liked this user."""
    r = await get_redis()
    key = f"liked_me:{user_id}"
    return await r.smembers(key)


async def has_liked_me(target_user_id: str, liker_user_id: str) -> bool:
    """Check if liker has liked the target user (cached)."""
    r = await get_redis()
    key = f"liked_me:{target_user_id}"
    return await r.sismember(key, liker_user_id)


async def remove_user_from_liked_me(user_id: str) -> None:
    """Remove a user from all liked_me sets (used when user is deactivated)."""
    r = await get_redis()
    # Scan for all liked_me keys and remove this user
    cursor = 0
    while True:
        cursor, keys = await r.scan(cursor, match="liked_me:*", count=100)
        if keys:
            pipe = r.pipeline()
            for key in keys:
                await pipe.srem(key, user_id)
            await pipe.execute()
        if cursor == 0:
            break


# ── Flush helpers ──


async def flush_all_stacks_and_likes() -> None:
    """Flush all stack:* and liked_me:* keys from Redis. Used by admin reset."""
    r = await get_redis()
    for pattern in ("stack:*", "liked_me:*"):
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor, match=pattern, count=100)
            if keys:
                await r.delete(*keys)
            if cursor == 0:
                break
    logger.info("Flushed all stack and liked_me keys from Redis")
