from datetime import timedelta
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit

import requests
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from cuentas.models import MojoAuthSocialFlow
from tests.contracts import assert_schema
from tests.helpers import medico

REDIRECT = "https://medvox.example.test/login/social"


@override_settings(
    AUTH_PROVIDER="mojoauth",
    MOJOAUTH_API_KEY="test-key-not-a-real-credential",
    MOJOAUTH_API_SECRET="test-secret-not-real",
    MOJOAUTH_SOCIAL_PROVIDERS=["google", "facebook"],
    MOJOAUTH_REDIRECT_URL=REDIRECT,
)
class MojoAuthSocialTests(APITestCase):
    def setUp(self):
        cache.clear()  # Throttle counters.
        self.user, self.profile = medico()
        self.user.email = "medico@example.test"
        self.user.save()

    def provider(self, data, status=200):
        response = Mock()
        response.status_code = status
        response.json.return_value = data
        return response

    def authenticated(self, identifier="medico@example.test"):
        return self.provider(
            {
                "authenticated": True,
                "user": {"identifier": identifier},
                "oauth": {"access_token": "provider-token-never-stored"},
            }
        )

    def start(self, proveedor="google"):
        return self.client.post(
            "/api/auth/mojoauth/social/start", {"proveedor": proveedor}, format="json"
        )

    def verify(self, flujo, state_id="provider-state-123"):
        return self.client.post(
            "/api/auth/mojoauth/social/verify",
            {"flujo": flujo, "state_id": state_id},
            format="json",
        )

    def test_start_builds_server_side_redirect_without_secret(self):
        response = self.start("facebook")
        self.assertEqual(response.status_code, 200)
        self.assertIn("no-store", response["Cache-Control"])
        body = response.json()
        url = urlsplit(body["url"])
        self.assertEqual(
            (url.scheme, url.netloc, url.path),
            ("https", "api.mojoauth.com", "/oauth/social"),
        )
        self.assertEqual(
            parse_qs(url.query),
            {
                "api_key": ["test-key-not-a-real-credential"],
                "provider": ["facebook"],
                "redirect_url": [REDIRECT],
            },
        )
        self.assertNotIn("test-secret-not-real", str(body))
        flow = MojoAuthSocialFlow.objects.get()
        self.assertEqual(flow.proveedor, "facebook")
        self.assertNotEqual(flow.digest, body["flujo"])

    def test_start_rejects_disabled_or_unknown_provider(self):
        with self.settings(MOJOAUTH_SOCIAL_PROVIDERS=["google"]):
            self.assertEqual(self.start("facebook").status_code, 503)
        with self.settings(MOJOAUTH_REDIRECT_URL=""):
            self.assertEqual(self.start().status_code, 503)
        with self.settings(AUTH_PROVIDER="password"):
            self.assertEqual(self.start().status_code, 503)
        self.assertEqual(self.start("twitter").status_code, 400)
        self.assertFalse(MojoAuthSocialFlow.objects.exists())

    @patch("cuentas.mojoauth.requests.get")
    def test_success_checks_state_on_server_and_returns_internal_jwt(self, get):
        get.return_value = self.authenticated("MEDICO@example.test")
        response = self.verify(self.start().json()["flujo"])
        self.assertEqual(response.status_code, 200, response.content)
        assert_schema(self, "LoginRespuesta", response.json())
        self.assertEqual(response.json()["medico"]["id"], self.profile.pk)
        self.assertNotIn("provider-token-never-stored", response.content.decode())
        self.assertEqual(get.call_args.args[0], "https://api.mojoauth.com/users/status")
        self.assertEqual(
            get.call_args.kwargs["params"], {"state_id": "provider-state-123"}
        )
        self.assertEqual(
            get.call_args.kwargs["headers"]["X-API-Secret"], "test-secret-not-real"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + response.json()["access"]
        )
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    @patch("cuentas.mojoauth.requests.get")
    def test_email_field_is_preferred_over_identifier(self, get):
        get.return_value = self.provider(
            {
                "authenticated": True,
                "user": {"identifier": "1234567890", "email": "medico@example.test"},
            }
        )
        self.assertEqual(self.verify(self.start().json()["flujo"]).status_code, 200)

    @patch("cuentas.mojoauth.requests.get")
    def test_unlinked_inactive_or_ambiguous_accounts_are_denied(self, get):
        get.return_value = self.authenticated("otra@example.test")
        self.assertEqual(self.verify(self.start().json()["flujo"]).status_code, 401)
        get.return_value = self.authenticated("sin-correo")
        response = self.verify(self.start().json()["flujo"], "provider-state-456")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["codigo"], "acceso_social_invalido")
        get.return_value = self.authenticated()
        other, _ = medico("other")
        other.email = "medico@example.test"
        other.save()
        response = self.verify(self.start().json()["flujo"], "provider-state-789")
        self.assertEqual(response.status_code, 401)
        other.email = ""
        other.save()
        self.user.is_active = False
        self.user.save()
        response = self.verify(self.start().json()["flujo"], "provider-state-000")
        self.assertEqual(response.status_code, 401)

    @patch("cuentas.mojoauth.requests.get")
    def test_not_authenticated_consumes_flow(self, get):
        get.return_value = self.provider({"authenticated": False})
        flujo = self.start().json()["flujo"]
        self.assertEqual(self.verify(flujo).status_code, 401)
        get.return_value = self.authenticated()
        self.assertEqual(self.verify(flujo, "provider-state-456").status_code, 401)
        self.assertEqual(get.call_count, 1)

    @patch("cuentas.mojoauth.requests.get")
    def test_flow_and_state_cannot_be_replayed(self, get):
        get.return_value = self.authenticated()
        flujo = self.start().json()["flujo"]
        self.assertEqual(self.verify(flujo).status_code, 200)
        self.assertEqual(self.verify(flujo).status_code, 401)
        # A state captured from another browser is useless with a fresh flow.
        self.assertEqual(self.verify(self.start().json()["flujo"]).status_code, 401)
        self.assertEqual(get.call_count, 1)

    @patch("cuentas.mojoauth.requests.get")
    def test_expired_or_unknown_flow_never_calls_provider(self, get):
        flujo = self.start().json()["flujo"]
        MojoAuthSocialFlow.objects.update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        self.assertEqual(self.verify(flujo).status_code, 401)
        self.assertEqual(self.verify("x" * 43).status_code, 401)
        get.assert_not_called()

    @patch("cuentas.mojoauth.requests.get")
    def test_provider_unavailable_keeps_flow_for_retry(self, get):
        flujo = self.start().json()["flujo"]
        for failure in [requests.ConnectionError(), self.provider({}, status=500)]:
            if isinstance(failure, Exception):
                get.side_effect = failure
            else:
                get.side_effect, get.return_value = None, failure
            response = self.verify(flujo)
            self.assertEqual(response.status_code, 503)
            assert_schema(self, "Error", response.json())
        get.side_effect, get.return_value = None, self.authenticated()
        self.assertEqual(self.verify(flujo).status_code, 200)

    def test_invalid_input(self):
        flujo = self.start().json()["flujo"]
        for datos in [
            {"flujo": flujo},
            {"flujo": "corto", "state_id": "provider-state-123"},
            {"flujo": flujo, "state_id": "con espacios no válidos"},
            {"flujo": flujo, "state_id": "provider-state-123", "email": "x@y.z"},
        ]:
            response = self.client.post(
                "/api/auth/mojoauth/social/verify", datos, format="json"
            )
            self.assertEqual(response.status_code, 400, datos)
