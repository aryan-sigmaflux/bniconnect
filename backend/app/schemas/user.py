"""
Pydantic schemas for User-related endpoints.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class UserCard(BaseModel):
    """Minimal user info shown on swipe cards."""

    id: uuid.UUID
    name: str
    business_name: str | None = None
    business_category: str | None = None
    description: str | None = None
    profile_image: str | None = None

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    """Full user profile returned by /users/me."""

    id: uuid.UUID
    phone: str
    name: str
    business_name: str | None = None
    business_category: str | None = None
    description: str | None = None
    profile_image: str | None = None
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserStackResponse(BaseModel):
    stack: list[UserCard]
    total: int


class AdminMemberCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    name: str = Field(..., min_length=1, max_length=100)
    business_name: str | None = Field(None, max_length=150)
    business_category: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)


class AdminMemberUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    business_name: str | None = Field(None, max_length=150)
    business_category: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, min_length=10, max_length=15)
    is_active: bool | None = None


class AdminMemberResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: str
    business_name: str | None = None
    business_category: str | None = None
    description: str | None = None
    profile_image: str | None = None
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MemberSwipeStats(BaseModel):
    """Member info with aggregated swipe counts for the admin dashboard."""
    id: uuid.UUID
    name: str
    profile_image: str | None = None
    liked_count: int = 0
    rejected_count: int = 0


class SwipedUserInfo(BaseModel):
    """Brief user info shown in swipe detail lists."""
    id: uuid.UUID
    name: str
    profile_image: str | None = None
    business_name: str | None = None


class MemberSwipeDetail(BaseModel):
    """Full swipe breakdown for a single member."""
    member: SwipedUserInfo
    liked: list[SwipedUserInfo] = []
    rejected: list[SwipedUserInfo] = []
    not_swiped: list[SwipedUserInfo] = []
