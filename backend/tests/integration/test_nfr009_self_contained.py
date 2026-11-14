"""[NFR-009] The app makes no outside calls and loads no outside assets."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
URL = re.compile(
    r"""(?:src|href)\s*=\s*["']https?://|url\(\s*["']?https?://|@import\s+["']?https?://"""
)
NET = re.compile(
    r"^\s*(?:import|from)\s+(requests|httpx|urllib3?|smtplib|aiohttp|openai|anthropic)\b",
    re.M,
)


def test_nfr009_backend_imports_no_network_clients() -> None:
    offenders = [
        str(p) for p in (ROOT / "backend" / "app").rglob("*.py") if NET.search(p.read_text("utf-8"))
    ]
    assert offenders == []


def test_nfr009_frontend_loads_no_outside_assets() -> None:
    files = [ROOT / "frontend" / "index.html"]
    src = ROOT / "frontend" / "src"
    files += [p for p in src.rglob("*") if p.suffix in {".ts", ".tsx", ".css", ".html"}]
    offenders = [str(p) for p in files if p.exists() and URL.search(p.read_text("utf-8"))]
    assert offenders == []
