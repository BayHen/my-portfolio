"""Database-backed administrator sessions and CSRF checks."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import AdminAccount, AdminSession, AuditEvent, LoginAttempt

COOKIE_NAME = "devfolio_admin"
hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
DUMMY_HASH = hasher.hash("unavailable-administrator-account")
Db = Annotated[Session, Depends(get_db)]


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def password_valid(stored: str, candidate: str) -> bool:
    try:
        return hasher.verify(stored, candidate)
    except (VerifyMismatchError, ValueError):
        return False


def audit(
    db: Session,
    action: str,
    *,
    actor_id: int | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
) -> None:
    db.add(
        AuditEvent(actor_id=actor_id, action=action, target_type=target_type, target_id=target_id)
    )


def login(db: Session, email: str, password: str, ip: str, settings: Settings):
    ip_hash = hmac.new(
        settings.contact_hash_secret.encode(), f"{ip}|{email.lower()}".encode(), hashlib.sha256
    ).hexdigest()
    since = datetime.now(timezone.utc) - timedelta(minutes=15)
    failures = (
        db.scalar(
            select(func.count(LoginAttempt.id)).where(
                LoginAttempt.ip_hash == ip_hash,
                LoginAttempt.succeeded.is_(False),
                LoginAttempt.created_at >= since,
            )
        )
        or 0
    )
    if failures >= 5:
        raise AppError("rate_limited", 429, "Try again later.")
    account = db.scalar(select(AdminAccount).where(AdminAccount.email == email.lower()))
    # Verify a fixed hash when no account exists to reduce timing differences.
    valid = password_valid(account.password_hash if account else DUMMY_HASH, password)
    db.add(LoginAttempt(ip_hash=ip_hash, succeeded=bool(account and valid)))
    if not account or not valid:
        audit(db, "login_failed")
        db.commit()
        raise AppError("invalid_credentials", 401, "Invalid credentials.")
    token = secrets.token_urlsafe(48)
    csrf = secrets.token_urlsafe(32)
    session = AdminSession(
        account_id=account.id,
        token_hash=digest(token),
        csrf_token=csrf,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.admin_session_hours),
    )
    db.add(session)
    audit(db, "login_success", actor_id=account.id)
    db.commit()
    return account, token, csrf


def get_admin_session(request: Request, db: Db) -> AdminSession:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise AppError("unauthorized", 401, "Authentication required.")
    session = db.scalar(select(AdminSession).where(AdminSession.token_hash == digest(token)))
    if not session:
        raise AppError("unauthorized", 401, "Session expired.")
    expiry = (
        session.expires_at.replace(tzinfo=timezone.utc)
        if session.expires_at.tzinfo is None
        else session.expires_at
    )
    if session.revoked_at or expiry <= datetime.now(timezone.utc):
        raise AppError("unauthorized", 401, "Session expired.")
    return session


def require_admin(session: Annotated[AdminSession, Depends(get_admin_session)]) -> AdminSession:
    return session


def require_write(
    request: Request, session: Annotated[AdminSession, Depends(get_admin_session)]
) -> AdminSession:
    token = request.headers.get("X-CSRF-Token", "")
    if not token or not hmac.compare_digest(token, session.csrf_token):
        raise AppError("csrf_failed", 403, "Invalid CSRF token.")
    return session


def cookie_options(settings: Settings) -> dict:
    return {
        "httponly": True,
        "secure": settings.admin_cookie_secure,
        "samesite": "strict",
        "path": "/",
        "max_age": settings.admin_session_hours * 3600,
    }
