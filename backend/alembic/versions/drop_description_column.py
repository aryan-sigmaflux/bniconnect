"""drop description column from users

Revision ID: a3c1e8f92d01
Revises: 22cd2fd4b171
Create Date: 2026-05-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a3c1e8f92d01"
down_revision: Union[str, None] = "22cd2fd4b171"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "description")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("description", sa.String(500), nullable=True),
    )
