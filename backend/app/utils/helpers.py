"""
Utility functions shared across the backend.
"""

import os
import re
import uuid
from pathlib import Path

from app.config import get_settings

settings = get_settings()


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number to E.164 format.
    Accepts: '9876543210', '+919876543210', '919876543210'
    Returns: '+919876543210'
    """
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    # Already has + prefix
    if phone.startswith("+") and len(digits) >= 10:
        return f"+{digits}"
    return phone


def validate_phone(phone: str) -> bool:
    """Validate phone number format (E.164)."""
    pattern = r"^\+[1-9]\d{6,14}$"
    return bool(re.match(pattern, phone))


def get_upload_path(filename: str) -> str:
    """
    Generate a unique file path for an uploaded image.
    Returns the relative path from the upload root.
    """
    ext = Path(filename).suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return os.path.join("profiles", unique_name)


def ensure_upload_dirs() -> None:
    """Create upload directories if they don't exist."""
    upload_root = Path(settings.UPLOAD_DIR)
    (upload_root / "profiles").mkdir(parents=True, exist_ok=True)
