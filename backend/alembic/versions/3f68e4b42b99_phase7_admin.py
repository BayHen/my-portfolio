"""phase7_admin

Revision ID: 3f68e4b42b99
Revises: 4c447ed2a737
Create Date: 2026-11-05 10:13:38.967897

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3f68e4b42b99"
down_revision: Union[str, Sequence[str], None] = "4c447ed2a737"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "experiences", sa.Column("current", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.execute("UPDATE experiences SET current = true WHERE end_date IS NULL")
    op.add_column("contact_messages", sa.Column("read_at", sa.DateTime(timezone=True)))
    op.create_table(
        "admin_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("password_hash", sa.String(500), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_admin_accounts_email", "admin_accounts", ["email"], unique=True)
    op.create_table(
        "admin_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "account_id",
            sa.Integer(),
            sa.ForeignKey("admin_accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("csrf_token", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_admin_sessions_token_hash", "admin_sessions", ["token_hash"], unique=True)
    op.create_index("ix_admin_sessions_expiry", "admin_sessions", ["expires_at"])
    op.create_table(
        "login_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ip_hash", sa.String(64), nullable=False),
        sa.Column("succeeded", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_login_attempts_ip_created", "login_attempts", ["ip_hash", "created_at"])
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "actor_id", sa.Integer(), sa.ForeignKey("admin_accounts.id", ondelete="SET NULL")
        ),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("target_type", sa.String(80)),
        sa.Column("target_id", sa.String(120)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("experiences", "current")
    op.drop_table("audit_events")
    op.drop_index("ix_login_attempts_ip_created", table_name="login_attempts")
    op.drop_table("login_attempts")
    op.drop_index("ix_admin_sessions_expiry", table_name="admin_sessions")
    op.drop_index("ix_admin_sessions_token_hash", table_name="admin_sessions")
    op.drop_table("admin_sessions")
    op.drop_index("ix_admin_accounts_email", table_name="admin_accounts")
    op.drop_table("admin_accounts")
    op.drop_column("contact_messages", "read_at")
