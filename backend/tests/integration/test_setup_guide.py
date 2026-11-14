"""US-018 [AC-062][AC-063][AC-064][NFR-011][NFR-013]: the setup guide (README.md)."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def _readme() -> str:
    return (ROOT / "README.md").read_text(encoding="utf-8")


def test_ac062_nfr011_explains_install_start_and_settings() -> None:
    text = _readme()
    low = text.lower()
    assert "install" in low and "start" in low
    assert "pip install" in low and "npm install" in low
    assert "uvicorn" in low
    assert "BOOTSTRAP_ADMIN_EMAIL" in text and "BOOTSTRAP_ADMIN_PASSWORD" in text
    assert "SESSION_IDLE_MINUTES" in text
    assert "30 minutes" in low
    assert "DATABASE_URL" in text


def test_ac063_nfr011_csv_format_columns_separator_and_example() -> None:
    text = _readme()
    low = text.lower()
    for column in ("title", "year", "genres", "director", "cast", "plot"):
        assert column in low, column
    # the exact header line, in order, appears in the guide (e.g. in the example file)
    assert "title,year,genres,director,cast,plot" in text
    assert "'|'" in text or "`|`" in text or '"|"' in text
    assert "separator" in low or "separated" in low
    assert "example" in low
    # an example data row uses '|' between values
    assert re.search(r"^[^\n|]+,\d{4},[^,\n]*\|[^,\n]*,", text, re.M)


def test_ac064_nfr011_limits_reset_verification_services_scale() -> None:
    low = _readme().lower()
    assert "known limits" in low
    assert "password reset" in low
    assert "email verification" in low
    assert "no outside service" in low or "needs no outside service" in low
    assert "5,000" in low and "movies" in low


def test_nfr013_documentation_is_english_only() -> None:
    text = _readme()
    assert all(ord(ch) < 0x250 or ch in "–—‘’“”…•→✓" for ch in text)
