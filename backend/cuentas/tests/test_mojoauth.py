from datetime import timedelta
from unittest.mock import Mock, patch

from django.core.cache import cache
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from tests.contracts import assert_schema
from tests.helpers import medico


@override_settings(
    AUTH_PROVIDER="mojoauth",
    MOJOAUTH_API_KEY="test-key-not-a-real-credential",
    MOJOAUTH_API_SECRET="",
)
class MojoAuthTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user, self.profile = medico()
        self.user.email = "medico@example.test"
        self.user.save()

    def provider(self, data):
        response = Mock()
        response.status_code = 200
        response.json.return_value = data
        return response

    def start(self, email="medico@example.test"):
        return self.client.post(
            "/api/auth/mojoauth/start", {"email": email}, format="json"
        )

    def verify(self, challenge_id, otp="123456"):
        return self.client.post(
            "/api/auth/mojoauth/verify",
            {"challenge_id": challenge_id, "otp": otp},
            format="json",
        )

    @patch("cuentas.mojoauth.requests.post")
    def test_success_uses_server_state_and_returns_internal_jwt(self, post):
        post.side_effect = [
            self.provider({"state_id": "provider-state"}),
            self.provider({"authenticated": True}),
        ]
        response = self.start()
        self.assertEqual(response.status_code, 202)
        challenge = response.json()["challenge_id"]
        self.assertNotIn("provider-state", str(response.json()))
        response = self.verify(challenge)
        self.assertEqual(response.status_code, 200)
        assert_schema(self, "LoginRespuesta", response.json())
        self.assertEqual(response.json()["medico"]["id"], self.profile.pk)
        self.assertEqual(
            post.call_args.kwargs["json"],
            {"state_id": "provider-state", "otp": "123456"},
        )
        self.assertEqual(
            post.call_args.kwargs["headers"]["X-API-Key"],
            "test-key-not-a-real-credential",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + response.json()["access"]
        )
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    @patch("cuentas.mojoauth.requests.post")
    def test_unknown_or_inactive_email_never_gets_enrolled(self, post):
        for email in ["unknown@example.test", "medico@example.test"]:
            self.user.is_active = False
            self.user.save()
            response = self.start(email)
            self.assertEqual(response.status_code, 202)
            self.assertEqual(
                self.verify(response.json()["challenge_id"]).status_code, 401
            )
        post.assert_not_called()

    @patch("cuentas.mojoauth.requests.post")
    def test_ambiguous_email_denies_access(self, post):
        other, _ = medico("other")
        other.email = self.user.email
        other.save()
        self.assertEqual(self.start().status_code, 202)
        post.assert_not_called()

    @patch("cuentas.mojoauth.requests.post")
    def test_invalid_otp_is_limited_and_cannot_replay(self, post):
        post.return_value = self.provider({"state_id": "provider-state"})
        challenge = self.start().json()["challenge_id"]
        post.return_value = self.provider({"authenticated": False})
        for _ in range(5):
            self.assertEqual(self.verify(challenge).status_code, 401)
        attempts = post.call_count
        self.assertEqual(self.verify(challenge).status_code, 401)
        self.assertEqual(post.call_count, attempts)

    @patch("cuentas.mojoauth.requests.post")
    def test_expiry_replay_and_deactivation(self, post):
        from cuentas.models import MojoAuthChallenge

        post.return_value = self.provider({"state_id": "provider-state"})
        challenge = self.start().json()["challenge_id"]
        MojoAuthChallenge.objects.update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        calls = post.call_count
        self.assertEqual(self.verify(challenge).status_code, 401)
        self.assertEqual(post.call_count, calls)
        cache.clear()
        challenge = self.start().json()["challenge_id"]
        post.return_value = self.provider({"authenticated": True})
        self.assertEqual(self.verify(challenge).status_code, 200)
        self.assertEqual(self.verify(challenge).status_code, 401)
        cache.clear()
        post.return_value = self.provider({"state_id": "provider-state"})
        challenge = self.start().json()["challenge_id"]
        self.user.is_active = False
        self.user.save()
        calls = post.call_count
        self.assertEqual(self.verify(challenge).status_code, 401)
        self.assertEqual(post.call_count, calls)

    @patch("cuentas.mojoauth.requests.post")
    def test_provider_failure_fails_closed_without_details(self, post):
        import requests

        post.side_effect = requests.Timeout("private-key-detail")
        response = self.start()
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private-key-detail", str(response.json()))
        self.assertNotIn("test-key", str(response.json()))

    @patch("cuentas.mojoauth.requests.post")
    def test_provider_malformed_success_is_rejected(self, post):
        post.return_value = self.provider({"state_id": "provider-state"})
        challenge = self.start().json()["challenge_id"]
        post.return_value = self.provider({"authenticated": "true"})
        self.assertEqual(self.verify(challenge).status_code, 401)

    @patch("cuentas.mojoauth.requests.post")
    def test_email_cooldown_and_no_provider_state_in_browser(self, post):
        post.return_value = self.provider({"state_id": "provider-state"})
        self.assertEqual(self.start().status_code, 202)
        self.assertEqual(self.start().status_code, 429)
        self.assertEqual(post.call_count, 1)

    def test_password_login_disabled_in_mojoauth_mode(self):
        response = self.client.post(
            "/api/auth/login",
            {"usuario": "doctor", "contrasena": "clave-ficticia-tests-2026"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_no_client_selected_identity_or_provider_state(self):
        for data in [
            {"email": self.user.email, "usuario": "doctor"},
            {"email": "invalid"},
        ]:
            self.assertEqual(
                self.client.post(
                    "/api/auth/mojoauth/start", data, format="json"
                ).status_code,
                400,
            )
        self.assertEqual(
            self.client.post(
                "/api/auth/mojoauth/verify",
                {"state_id": "injected", "otp": "123456"},
                format="json",
            ).status_code,
            400,
        )

    @patch("cuentas.mojoauth.requests.post")
    def test_changed_email_revokes_pending_challenge(self, post):
        post.return_value = self.provider({"state_id": "provider-state"})
        challenge = self.start().json()["challenge_id"]
        self.user.email = "changed@example.test"
        self.user.save()
        calls = post.call_count
        self.assertEqual(self.verify(challenge).status_code, 401)
        self.assertEqual(post.call_count, calls)

    @patch("cuentas.mojoauth.requests.post")
    def test_response_for_another_provider_state_is_rejected(self, post):
        post.return_value = self.provider({"state_id": "provider-state"})
        challenge = self.start().json()["challenge_id"]
        post.return_value = self.provider(
            {"authenticated": True, "state_id": "different-state"}
        )
        self.assertEqual(self.verify(challenge).status_code, 401)

    def test_binding_only_updates_existing_medical_user_and_rejects_duplicates(self):
        from io import StringIO

        from django.core.management import call_command
        from django.core.management.base import CommandError

        output = StringIO()
        call_command(
            "vincular_medico",
            usuario="doctor",
            email="Nuevo@Example.test",
            stdout=output,
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "nuevo@example.test")
        self.assertNotIn(self.user.email, output.getvalue())
        other, _ = medico("other")
        with self.assertRaises(CommandError):
            call_command(
                "vincular_medico",
                usuario=other.username,
                email=self.user.email,
                stdout=StringIO(),
            )
        with self.assertRaises(CommandError):
            call_command(
                "vincular_medico",
                usuario="missing",
                email="missing@example.test",
                stdout=StringIO(),
            )


@override_settings(
    AUTH_PROVIDER="mojoauth",
    MOJOAUTH_API_KEY="test-key-not-a-real-credential",
    MOJOAUTH_API_SECRET="",
)
class ConcurrentMojoAuthTests(TransactionTestCase):
    @patch("cuentas.mojoauth.requests.post")
    def test_challenge_can_issue_only_one_session(self, post):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier

        from django.db import close_old_connections, connection
        from rest_framework.test import APIClient

        cache.clear()
        user, _ = medico()
        user.email = "medico@example.test"
        user.save()
        response = Mock()
        response.status_code = 200
        response.json.return_value = {"state_id": "provider-state"}
        post.return_value = response
        challenge = (
            APIClient()
            .post("/api/auth/mojoauth/start", {"email": user.email}, format="json")
            .json()["challenge_id"]
        )
        response.json.return_value = {"authenticated": True}
        post.reset_mock()
        barrier = Barrier(2)

        def verify(_):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                return (
                    APIClient()
                    .post(
                        "/api/auth/mojoauth/verify",
                        {"challenge_id": challenge, "otp": "123456"},
                        format="json",
                    )
                    .status_code
                )
            finally:
                connection.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(verify, range(2)))
        self.assertEqual(sorted(results), [200, 401])
        self.assertEqual(post.call_count, 1)
