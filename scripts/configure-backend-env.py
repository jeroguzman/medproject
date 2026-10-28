#!/usr/bin/env python3
"""Create a local backend .env without printing secrets or overwriting existing values."""

import secrets
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "backend" / ".env"
values = {
    "POSTGRES_DB": "vozclinica",
    "POSTGRES_USER": "vozclinica",
    "POSTGRES_PORT": "55432",
    "DEBUG": "true",
    "ALLOWED_HOSTS": "127.0.0.1,localhost",
    "CORS_ALLOWED_ORIGINS": "http://localhost:8080",
}
if path.exists():
    print("backend/.env ya existe; se conserva sin modificar.")
    raise SystemExit(0)
password = secrets.token_urlsafe(32)
values.update(
    POSTGRES_PASSWORD=password,
    DATABASE_URL=f"postgresql://vozclinica:{password}@127.0.0.1:55432/vozclinica",
    DJANGO_SECRET_KEY=secrets.token_urlsafe(64),
    DEMO_PASSWORD=secrets.token_urlsafe(24),
)
# Exclusive creation prevents concurrent invocations from replacing a local configuration.
with path.open("x", encoding="utf-8") as handle:
    path.chmod(0o600)
    handle.write("".join(f"{key}={value}\n" for key, value in values.items()))
print(
    "backend/.env creado con secretos locales; ningún valor se muestra ni se agrega a Git."
)
