"""Settings named in the setup docs are read from the environment."""

from app.config import get_settings


def test_ac023_nfr011_session_idle_and_cors_settings(monkeypatch) -> None:
    monkeypatch.delenv("SESSION_IDLE_MINUTES", raising=False)
    assert get_settings().session_idle_minutes == 30
    monkeypatch.setenv("SESSION_IDLE_MINUTES", "45")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://a.example, https://b.example")
    settings = get_settings()
    assert settings.session_idle_minutes == 45
    assert settings.allowed_origins == ["https://a.example", "https://b.example"]
