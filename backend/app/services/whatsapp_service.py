"""
WhatsApp Business Cloud API service — sends OTP and match notification messages.
"""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

BASE_URL = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json",
    }


async def send_otp(phone: str, otp_code: str) -> bool:
    """
    Send OTP via WhatsApp template message.
    Returns True if successful, False otherwise.
    """
    # Format OTP with spaces for readability: "4 9 2 1 8 3"
    formatted_otp = " ".join(otp_code)

    payload = {
        "messaging_product": "whatsapp",
        "to": phone.lstrip("+"),
        "type": "template",
        "template": {
            "name": settings.WHATSAPP_OTP_TEMPLATE,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": formatted_otp}
                    ],
                }
            ],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(BASE_URL, json=payload, headers=_headers())
            response.raise_for_status()
            logger.info(f"OTP sent to {phone[-4:]}")
            return True
    except httpx.HTTPStatusError as e:
        logger.error(f"WhatsApp API error sending OTP: {e.response.status_code} — {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"Failed to send OTP via WhatsApp: {e}")
        return False


async def send_match_notification(phone: str, matched_with_name: str) -> bool:
    """
    Send match notification via WhatsApp template message.
    Called as a background task so it doesn't block the swipe response.
    """
    payload = {
        "messaging_product": "whatsapp",
        "to": phone.lstrip("+"),
        "type": "template",
        "template": {
            "name": settings.WHATSAPP_MATCH_TEMPLATE,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": matched_with_name}
                    ],
                }
            ],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(BASE_URL, json=payload, headers=_headers())
            response.raise_for_status()
            logger.info(f"Match notification sent to {phone[-4:]} about {matched_with_name}")
            return True
    except httpx.HTTPStatusError as e:
        logger.error(
            f"WhatsApp API error sending match notification: {e.response.status_code} — {e.response.text}"
        )
        return False
    except Exception as e:
        logger.error(f"Failed to send match notification: {e}")
        return False
