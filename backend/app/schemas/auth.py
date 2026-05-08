"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, Field


class SendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, examples=["+919876543210"])


class SendOTPResponse(BaseModel):
    message: str = "OTP sent"


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserBrief"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserBrief(BaseModel):
    id: str
    name: str
    phone: str
    is_admin: bool
    profile_image: str | None = None


# Rebuild model to resolve forward ref
TokenResponse.model_rebuild()
