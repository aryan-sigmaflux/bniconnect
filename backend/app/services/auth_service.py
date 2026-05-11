"""
Authentication service — OTP generation/verification and JWT management.
"""

import hashlib
import hmac
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.otp import OTP
from app.models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── OTP ──


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(6)])


def hash_otp(otp: str) -> str:
    """Hash the OTP using bcrypt."""
    return pwd_context.hash(otp)


def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Verify a plain OTP against its bcrypt hash."""
    return pwd_context.verify(plain_otp, hashed_otp)


async def create_otp(db: AsyncSession, phone: str) -> str:
    """Generate and store a new OTP for the given phone number."""
    otp_code = generate_otp()
    otp_record = OTP(
        phone=phone,
        otp_hash=hash_otp(otp_code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
    )
    db.add(otp_record)
    await db.flush()
    logger.info(f"OTP created for phone {phone[-4:]}")
    return otp_code


def _is_bypass_phone(phone: str) -> bool:
    """Check if a phone number is in the dev bypass list."""
    if not settings.DEV_MODE:
        return False
    bypass_phones = [p.strip() for p in settings.DEV_BYPASS_PHONES.split(",") if p.strip()]
    return phone in bypass_phones


def _is_admin_phone(phone: str) -> bool:
    """Check if a phone number is in the admin list."""
    admin_numbers = [p.strip() for p in settings.ADMIN_NUMBER.split(",") if p.strip()]
    return phone in admin_numbers


async def verify_otp(db: AsyncSession, phone: str, otp_code: str) -> bool:
    """
    Verify the OTP for a phone number.
    Checks the latest unused, unexpired OTP.
    In DEV_MODE, bypass phones accept any 6-digit code.
    """
    # Dev bypass — accept any OTP for test numbers
    if _is_bypass_phone(phone):
        logger.warning(f"DEV MODE: OTP bypass for phone {phone[-4:]}")
        return True

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(OTP)
        .where(
            OTP.phone == phone,
            OTP.is_used == False,  # noqa: E712
            OTP.expires_at > now,
        )
        .order_by(OTP.created_at.desc())
        .limit(1)
    )
    otp_record = result.scalar_one_or_none()

    if otp_record is None:
        return False

    if not verify_otp_hash(otp_code, otp_record.otp_hash):
        return False

    # Mark OTP as used
    otp_record.is_used = True
    await db.flush()
    return True


# ── User lookup / creation ──


async def get_or_create_user(db: AsyncSession, phone: str) -> User:
    """
    Find existing user by phone, or create a new one.
    Sets is_admin if phone is in ADMIN_NUMBER list.
    """
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    is_admin = _is_admin_phone(phone)

    if user is None:
        user = User(
            phone=phone,
            name="New Member",  # Will be updated by admin
            is_admin=is_admin,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        logger.info(f"Created new user for phone {phone[-4:]} (admin={is_admin})")
    else:
        # Update admin status if ADMIN_NUMBER list changed
        if is_admin and not user.is_admin:
            user.is_admin = True
            await db.flush()

    return user


# ── JWT ──


def create_access_token(user_id: str, is_admin: bool) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": user_id,
        "is_admin": is_admin,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token."""
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None
