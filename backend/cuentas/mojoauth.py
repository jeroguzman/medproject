"""Server-side email OTP and social login, based on MojoAuth's published SDKs
(mojoauth-sdk 1.4.3 for Node and mojoauth-web-sdk 1.17.19 for the browser).

The browser cannot select a user, provider state or authentication result.
MojoAuth verifies the OTP for state created by this server; Django issues its own JWT.
"""

import hashlib
import secrets
from datetime import timedelta
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.utils import timezone

from cuentas.models import MojoAuthChallenge, MojoAuthSocialFlow

BASE_URL = "https://api.mojoauth.com"
MESSAGE = "Si el correo está autorizado, recibirás un código para iniciar sesión."
SOCIAL_MINUTES = 10


class ProviderUnavailable(Exception):
    pass


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def provider_headers():
    if settings.AUTH_PROVIDER != "mojoauth" or not settings.MOJOAUTH_API_KEY:
        raise ProviderUnavailable
    headers = {
        "X-API-Key": settings.MOJOAUTH_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if settings.MOJOAUTH_API_SECRET:
        headers["X-API-Secret"] = settings.MOJOAUTH_API_SECRET
    return headers


def provider_request(path, payload, *, verification=False):
    headers = provider_headers()
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


def social_start(provider):
    """Create a one-use flow and the MojoAuth URL that sends the browser to Google
    or Facebook. MojoAuth returns it to MOJOAUTH_REDIRECT_URL with ?state_id=."""
    if (
        provider not in settings.MOJOAUTH_SOCIAL_PROVIDERS
        or not settings.MOJOAUTH_REDIRECT_URL
    ):
        raise ProviderUnavailable
    # The project API key is public by design in MojoAuth's browser flow; the
    # secret stays here and the result is only trusted through provider_status.
    query = urlencode(
        {
            "api_key": provider_headers()["X-API-Key"],
            "provider": provider,
            "redirect_url": settings.MOJOAUTH_REDIRECT_URL,
        }
    )
    nonce = secrets.token_urlsafe(32)
    MojoAuthSocialFlow.objects.create(
        digest=digest(nonce),
        proveedor=provider,
        expires_at=timezone.now() + timedelta(minutes=SOCIAL_MINUTES),
    )
    return nonce, f"{BASE_URL}/oauth/social?{query}"


def provider_status(state_id):
    """Server-side equivalent of the SDK's pingStatus (GET /users/status)."""
    headers = provider_headers()
    try:
        response = requests.get(
            BASE_URL + "/users/status",
            params={"state_id": state_id},
            headers=headers,
            timeout=(3.05, 8),
            allow_redirects=False,
        )
        if response.status_code in (400, 401, 403, 404, 422):
            return {"authenticated": False}
        if response.status_code != 200:
            raise ProviderUnavailable
        data = response.json()
        if not isinstance(data, dict):
            raise ProviderUnavailable
        return data
    except (requests.RequestException, ValueError) as exc:
        raise ProviderUnavailable from exc


def social_email(data):
    if data.get("authenticated") is not True or not isinstance(data.get("user"), dict):
        return None
    for key in ("email", "identifier"):
        value = data["user"].get(key)
        if not isinstance(value, str):
            continue
        value = value.strip().casefold()
        try:
            validate_email(value)
        except ValidationError:
            continue
        return value
    return None


def social_verify(nonce, state_id):
    # Same rule as email OTP: only one active, previously linked doctor per email.
    with transaction.atomic():
        flow = (
            MojoAuthSocialFlow.objects.select_for_update()
            .filter(digest=digest(nonce))
            .first()
        )
        state = digest(state_id)
        if (
            flow is None
            or flow.consumed_at
            or flow.expires_at <= timezone.now()
            or MojoAuthSocialFlow.objects.filter(state_digest=state).exists()
        ):
            return None, False
        try:
            data = provider_status(state_id)
        except ProviderUnavailable:
            return None, True  # The flow stays usable so the doctor can retry.
        # A flow gets one provider answer and a state is never accepted twice.
        flow.consumed_at = timezone.now()
        flow.state_digest = state
        try:
            with transaction.atomic():
                flow.save(update_fields=["consumed_at", "state_digest"])
        except IntegrityError:
            return None, False
        email = social_email(data)
        if email is None or flow.expires_at <= timezone.now():
            return None, False
        users = list(
            get_user_model().objects.filter(
                email__iexact=email, is_active=True, medico__isnull=False
            )[:2]
        )
        if len(users) != 1:
            return None, False
        return users[0], False
