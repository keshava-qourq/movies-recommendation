"""Run Alembic programmatically, so no alembic.ini has to ship in the container."""

from pathlib import Path

from alembic import command
from alembic.config import Config

_HERE = Path(__file__).resolve().parent


def _config() -> Config:
    config = Config()
    config.set_main_option("script_location", str(_HERE))
    return config


def upgrade_to_head() -> None:
    command.upgrade(_config(), "head")
