"""
Pydantic schemas for Swipe and Match endpoints.
"""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel

from app.schemas.user import UserCard


class SwipeDirectionEnum(str, Enum):
    LIKE = "like"
    REJECT = "reject"


class SwipeRequest(BaseModel):
    swiped_id: uuid.UUID
    direction: SwipeDirectionEnum


class SwipeResponse(BaseModel):
    matched: bool
    matched_user: UserCard | None = None


class SentSwipeItem(BaseModel):
    user: UserCard
    swiped_at: datetime

    model_config = {"from_attributes": True}


class MatchItem(BaseModel):
    user: UserCard
    matched_at: datetime

    model_config = {"from_attributes": True}


class SentSwipeListResponse(BaseModel):
    sent: list[SentSwipeItem]
    total: int


class MatchListResponse(BaseModel):
    matches: list[MatchItem]
    total: int
