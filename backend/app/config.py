"""
Application settings loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/sigmaconnect"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ──
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Admin ──
    ADMIN_NUMBER: str = "+919876543210"

    # ── WhatsApp Business Cloud API ──
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_OTP_TEMPLATE: str = "otp_message"
    WHATSAPP_MATCH_TEMPLATE: str = "match_notification"
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v21.0"

    # ── File Upload ──
    UPLOAD_DIR: str = "uploads"
    MAX_IMAGE_SIZE_MB: int = 5

    # ── OTP ──
    OTP_EXPIRY_MINUTES: int = 5

    # ── Stack ──
    STACK_TTL_HOURS: int = 24

    # ── Dev Mode ──
    DEV_MODE: bool = False
    DEV_BYPASS_PHONES: str = ""  # comma-separated list, e.g. "+919876543210,+919326169639"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
