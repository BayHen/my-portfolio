"""Central media metadata and assignments.

Revision ID: 7e41ac9f12d0
Revises: 3f68e4b42b99
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "7e41ac9f12d0"
down_revision: Union[str, Sequence[str], None] = "3f68e4b42b99"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "media_assets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("storage_key", sa.String(200), nullable=False, unique=True),
        sa.Column("storage_backend", sa.String(10), nullable=False),
        sa.Column("url", sa.String(600), nullable=False),
        sa.Column("alt", sa.String(300), nullable=False),
        sa.Column("content_type", sa.String(40), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint("byte_size > 0", name="ck_media_assets_size"),
        sa.CheckConstraint("width > 0 AND height > 0", name="ck_media_assets_dimensions"),
    )
    op.create_table(
        "media_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "asset_id",
            sa.String(36),
            sa.ForeignKey("media_assets.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("slot", sa.String(40), nullable=False),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE")),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("position >= 0", name="ck_media_assignments_position"),
        sa.UniqueConstraint("slot", "project_id", "position", name="uq_media_assignment_position"),
    )
    op.create_index("ix_media_assignments_slot", "media_assignments", ["slot"])
    op.create_index("ix_media_assignments_asset_id", "media_assignments", ["asset_id"])
    op.create_index(
        "uq_media_global_slot",
        "media_assignments",
        ["slot"],
        unique=True,
        postgresql_where=sa.text("project_id IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_media_global_slot", table_name="media_assignments")
    op.drop_index("ix_media_assignments_asset_id", table_name="media_assignments")
    op.drop_index("ix_media_assignments_slot", table_name="media_assignments")
    op.drop_table("media_assignments")
    op.drop_table("media_assets")
