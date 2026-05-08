"""
Authentication routes — OTP send/verify and token refresh.
"""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    SendOTPRequest,
    SendOTPResponse,
    TokenResponse,
    UserBrief,
    VerifyOTPRequest,
)
from app.services import auth_service
from app.services import whatsapp_service
from app.utils.helpers import validate_phone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    body: SendOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Send a 6-digit OTP to the given phone number via WhatsApp.
    Only registered members (added by admin) can receive OTPs.
    """
    if not validate_phone(body.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Use E.164 format (e.g. +919876543210)",
        )

    # Check if this phone number belongs to a registered member
    result = await db.execute(
        select(User).where(User.phone == body.phone)
    )
    existing_user = result.scalar_one_or_none()
    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This number is not registered. Contact Sigmaflux Support.",
        )

    if not existing_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact admin.",
        )

    # Dev bypass — skip OTP generation and WhatsApp for test phones
    if auth_service._is_bypass_phone(body.phone):
        logger.warning(f"DEV MODE: Skipping OTP send for {body.phone[-4:]} — use any 6 digits")
        return SendOTPResponse(message="OTP sent")

    # Generate and store OTP
    otp_code = await auth_service.create_otp(db, body.phone)

    # Send via WhatsApp
    sent = await whatsapp_service.send_otp(body.phone, otp_code)
    if not sent:
        logger.error(f"WhatsApp OTP delivery failed for {body.phone[-4:]}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send OTP via WhatsApp. Please try again.",
        )

    await db.commit()
    return SendOTPResponse(message="OTP sent")


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    body: VerifyOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Verify the OTP and return JWT tokens + user info.
    If the user doesn't exist, a new account is created.
    """
    if not validate_phone(body.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format",
        )

    # Verify OTP
    is_valid = await auth_service.verify_otp(db, body.phone, body.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )

    # Get or create user
    user = await auth_service.get_or_create_user(db, body.phone)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact admin.",
        )

    # Issue tokens
    access_token = auth_service.create_access_token(str(user.id), user.is_admin)
    refresh_token = auth_service.create_refresh_token(str(user.id))

    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserBrief(
            id=str(user.id),
            name=user.name,
            phone=user.phone,
            is_admin=user.is_admin,
            profile_image=user.profile_image,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Issue a new access token using a valid refresh token.
    """
    payload = auth_service.decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id_str)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    access_token = auth_service.create_access_token(str(user.id), user.is_admin)
    new_refresh_token = auth_service.create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserBrief(
            id=str(user.id),
            name=user.name,
            phone=user.phone,
            is_admin=user.is_admin,
            profile_image=user.profile_image,
        ),
    )
