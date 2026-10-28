"""Server-side email OTP, based on MojoAuth's published Node SDK 1.4.3.

The browser cannot select a user, provider state or authentication result.
MojoAuth verifies the OTP for state created by this server; Django issues its own JWT.
"""

import hashlib
import secrets
from datetime import timedelta

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from cuentas.models import MojoAuthChallenge

BASE_URL = "https://api.mojoauth.com"
MESSAGE = "Si el correo está autorizado, recibirás un código para iniciar sesión."


class ProviderUnavailable(Exception):
    pass


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def provider_request(path, payload, *, verification=False):
    if settings.AUTH_PROVIDER != "mojoauth" or not settings.MOJOAUTH_API_KEY:
        raise ProviderUnavailable
    headers = {
        "X-API-Key": settings.MOJOAUTH_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if settings.MOJOAUTH_API_SECRET:
        headers["X-API-Secret"] = settings.MOJOAUTH_API_SECRET
    try:
        response = requests.post(
            BASE_URL + path,
            json=payload,
            headers=headers,
            timeout=(3.05, 8),
            allow_redirects=False,
        )
        if verification and response.status_code in (400, 401, 403, 404, 422):
            return {"authenticated": False}
        if response.status_code != 200:
            raise ProviderUnavailable
        data = response.json()
        if not isinstance(data, dict):
            raise ProviderUnavailable
        return data
    except (requests.RequestException, ValueError) as exc:
        raise ProviderUnavailable from exc


def start(email):
    email = email.strip().casefold()
    # Limit the mailbox as well as the caller's IP; no clinical data is involved.
    if not cache.add("mojoauth-cooldown:" + digest(email), True, timeout=60):
        return None
    nonce = secrets.token_urlsafe(32)
    candidates = get_user_model().objects.filter(
        email__iexact=email, is_active=True, medico__isnull=False
    )
    users = list(candidates[:2])
    if len(users) != 1:
        return nonce  # Same external response; never auto-register an unknown address.
    try:
        data = provider_request("/users/emailotp", {"email": email})
        state = data.get("state_id")
        if not isinstance(state, str) or not state or len(state) > 500:
            raise ProviderUnavailable
        MojoAuthChallenge.objects.create(
            digest=digest(nonce),
            email_digest=digest(email),
            usuario=users[0],
            provider_state=state,
            expires_at=timezone.now() + timedelta(minutes=5),
        )
    except ProviderUnavailable:
        cache.delete("mojoauth-cooldown:" + digest(email))
        raise
    return nonce


def verify(nonce, otp):
    # Return states instead of raising inside atomic: failed attempts must commit.
    with transaction.atomic():
        challenge = (
            MojoAuthChallenge.objects.select_for_update()
            .select_related("usuario")
            .filter(digest=digest(nonce))
            .first()
        )
        now = timezone.now()
        if (
            challenge is None
            or challenge.consumed_at
            or challenge.expires_at <= now
            or challenge.attempts >= 5
        ):
            return None, False
        user = challenge.usuario
        email = user.email.strip().casefold()
        if (
            not user.is_active
            or not hasattr(user, "medico")
            or digest(email) != challenge.email_digest
            or get_user_model()
            .objects.filter(email__iexact=email, is_active=True, medico__isnull=False)
            .count()
            != 1
        ):
            return None, False
        challenge.attempts += 1
        challenge.save(update_fields=["attempts"])
        try:
            data = provider_request(
                "/users/emailotp/verify",
                {"state_id": challenge.provider_state, "otp": otp},
                verification=True,
            )
        except ProviderUnavailable:
            return None, True
        if data.get("authenticated") is not True:
            return None, False
        if data.get("state_id", challenge.provider_state) != challenge.provider_state:
            return None, False
        if challenge.expires_at <= timezone.now():
            return None, False
        challenge.consumed_at = timezone.now()
        challenge.save(update_fields=["consumed_at"])
        return user, False
