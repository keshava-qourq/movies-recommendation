"""US-010 [AC-032][AC-033][NFR-009][NFR-013][NFR-014]: generated placeholder artwork.

The artwork is drawn in the browser, so these are static checks of its source. Rendering
on each screen is covered by frontend/src/lib/Artwork.test.tsx and the e2e spec.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "frontend" / "src"


def _artwork() -> str:
    return (SRC / "lib" / "Artwork.tsx").read_text("utf-8")


def test_ac032_nfr009_artwork_is_drawn_by_the_app_without_outside_assets() -> None:
    text = _artwork()
    assert "<svg" in text
    assert "<img" not in text
    assert not re.search(r"https?://", text)
    assert "fetch(" not in text


def test_ac032_every_movie_screen_uses_the_artwork() -> None:
    for name in ("Search", "MovieDetail", "ForYou"):
        assert "Artwork" in (SRC / "screens" / f"{name}.tsx").read_text("utf-8"), name


def test_ac033_nfr014_artwork_depends_only_on_title_and_year() -> None:
    text = _artwork()
    for banned in ("Math.random", "Date.now", "new Date", "crypto.", "useState", "useEffect"):
        assert banned not in text, banned
    assert "title" in text and "year" in text


def test_nfr013_artwork_source_is_english_latin() -> None:
    assert all(ord(ch) < 0x250 for ch in _artwork())
