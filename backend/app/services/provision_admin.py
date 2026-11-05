"""Provision one administrator from a local interactive terminal."""

import getpass
import re

from sqlalchemy import select

from app.core.admin_auth import hasher
from app.db.session import get_session_factory
from app.models.entities import AdminAccount


def main() -> None:
    email = input("Admin email: ").strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise SystemExit("Invalid email")
    password = getpass.getpass("New password (at least 16 characters): ")
    if len(password) < 16 or len(password) > 128:
        raise SystemExit("Password must contain 16–128 characters")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")
    with get_session_factory()() as db:
        if db.scalar(select(AdminAccount).where(AdminAccount.email == email)):
            raise SystemExit("Account already exists; no update performed")
        db.add(AdminAccount(email=email, password_hash=hasher.hash(password)))
        db.commit()
    print("Administrator provisioned")


if __name__ == "__main__":
    main()
