import hashlib
import hmac
import logging

import httpx
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError
from app.models import ContactMessage
from app.repositories.public import find_contact_by_key, recent_contact_count
from app.schemas.public import ContactIn, ContactOut

logger = logging.getLogger(__name__)


def _notify(message: ContactMessage, settings: Settings) -> str:
    if not settings.notification_configured:
        return "not_configured"
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.contact_notify_resend_api_key}"},
            json={
                "from": settings.contact_notify_from_email,
                "to": [settings.contact_notify_to_email],
                "reply_to": message.email,
                "subject": f"DEVFOLIO contact: {message.name.replace(chr(10), ' ')}",
                "text": f"Name: {message.name}\nEmail: {message.email}\n\n{message.message}",
            },
            timeout=8,
        )
        return "accepted" if response.is_success and response.json().get("id") else "failed"
    except (httpx.HTTPError, ValueError):
        logger.warning("contact notification failed", extra={"contact_id": message.id})
        return "failed"


def store_contact(
    db: Session, data: ContactIn, *, key: str, client_ip: str, settings: Settings
) -> ContactOut:
    existing = find_contact_by_key(db, key)
    if existing:
        if (existing.name, existing.email, existing.message) != (
            data.name.strip(),
            str(data.email),
            data.message.strip(),
        ):
            raise AppError("idempotency_conflict", 409, "This request key was already used.")
        return ContactOut(stored=True, notification=existing.notification_status)
    ip_hash = hmac.new(
        settings.contact_hash_secret.encode(), client_ip.encode(), hashlib.sha256
    ).hexdigest()
    if recent_contact_count(db, ip_hash) >= 5:
        raise AppError("rate_limited", 429, "Too many messages. Try again later.")
    message = ContactMessage(
        idempotency_key=key,
        name=data.name.strip(),
        email=str(data.email),
        message=data.message.strip(),
        ip_hash=ip_hash,
    )
    db.add(message)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = find_contact_by_key(db, key)
        if existing and (existing.name, existing.email, existing.message) == (
            data.name.strip(),
            str(data.email),
            data.message.strip(),
        ):
            return ContactOut(stored=True, notification=existing.notification_status)
        raise AppError("idempotency_conflict", 409, "This request key was already used.") from None
    db.refresh(message)
    message.notification_status = _notify(message, settings)
    db.commit()
    return ContactOut(stored=True, notification=message.notification_status)
