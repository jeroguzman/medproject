#!/usr/bin/env python3
"""Prepare local secrets for the Droplet without displaying or replacing them."""

import argparse
import os
import re
import secrets
from pathlib import Path
from urllib.parse import urlsplit

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--domain", required=True, help="Hostname de la API, sin https://")
parser.add_argument(
    "--frontend-origin", required=True, help="Origen HTTPS exacto del frontend"
)
parser.add_argument(
    "--demo-mode",
    choices=["simulated", "backend"],
    default="backend",
    help="simulated: flujo completo local; backend: acceso y expediente reales",
)
parser.add_argument(
    "--auth-provider", choices=["password", "mojoauth"], default="mojoauth"
)
args = parser.parse_args()
domain = args.domain.lower().rstrip(".")
if len(domain) > 253 or not re.fullmatch(
    r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}", domain
):
    parser.error(
        "El dominio debe ser un hostname DNS válido, sin esquema, puerto o ruta."
    )
origin = urlsplit(args.frontend_origin)
if (
    origin.scheme != "https"
    or not origin.hostname
    or origin.username
    or origin.password
    or origin.path not in ("", "/")
    or origin.query
    or origin.fragment
    or any(c.isspace() or c in "$#'\"" for c in args.frontend_origin)
):
    parser.error(
        "Usa un origen HTTPS exacto sin credenciales, ruta, query o fragmento."
    )
path = Path(__file__).resolve().parents[1] / ".env.production"
if path.exists():
    print(".env.production ya existe; se conserva sin modificar.")
    raise SystemExit(0)
values = {
    "API_DOMAIN": domain,
    "AUTH_PROVIDER": args.auth_provider,
    "MOJOAUTH_API_KEY": "",
    "FIRECRAWL_API_KEY": "",
    "MOJOAUTH_API_SECRET": "",
    "MOJOAUTH_SOCIAL_PROVIDERS": "google,facebook",
    "IA_ORQUESTADOR": "n8n",
    "N8N_BASE_URL": "",
    "N8N_SECRET": "",
    "ELEVENLABS_API_KEY": "",
    "BACKBOARD_API_KEY": "",
    "FRONTEND_MOCKS": "true" if args.demo_mode == "simulated" else "false",
    "CORS_ALLOWED_ORIGINS": args.frontend_origin.rstrip("/"),
    "POSTGRES_DB": "vozclinica",
    "POSTGRES_USER": "vozclinica",
    "POSTGRES_PASSWORD": secrets.token_urlsafe(32),
    "DJANGO_SECRET_KEY": secrets.token_urlsafe(64),
    "DEMO_PASSWORD": secrets.token_urlsafe(24),
}
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w", encoding="utf-8") as handle:
    handle.write("".join(f"{key}={value}\n" for key, value in values.items()))
print(".env.production creado con permisos 600. No se muestran los secretos.")
