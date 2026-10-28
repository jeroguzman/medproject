from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from tests.contracts import assert_schema
from tests.helpers import medico, note, patient


class ContractSecurityTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()
        self.patient = patient(self.profile)
        self.note = note(self.profile, self.patient)
        self.operations = [
            ("get", "/api/auth/me"),
            ("get", "/api/pacientes"),
            ("post", "/api/pacientes"),
            ("get", f"/api/pacientes/{self.patient.pk}"),
            ("patch", f"/api/pacientes/{self.patient.pk}"),
            ("get", f"/api/pacientes/{self.patient.pk}/notas"),
            ("get", f"/api/notas/{self.note.pk}"),
        ]

    def test_all_clinical_operations_deny_missing_expired_tampered_token(self):
        token = AccessToken.for_user(self.user)
        token.set_exp(
            from_time=timezone.now() - timedelta(days=1), lifetime=timedelta(seconds=1)
        )
        for value in [None, str(token), str(AccessToken.for_user(self.user)) + "bad"]:
            self.client.credentials(
                **({"HTTP_AUTHORIZATION": "Bearer " + value} if value else {})
            )
            for method, url in self.operations:
                response = getattr(self.client, method)(url, {}, format="json")
                self.assertEqual(response.status_code, 401, (method, url))
                assert_schema(self, "Error", response.json())

    def test_all_clinical_operations_deny_user_without_profile(self):
        user = get_user_model().objects.create_user(
            username="no_profile", password="clave-ficticia-tests-2026"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + str(AccessToken.for_user(user))
        )
        for method, url in self.operations:
            self.assertEqual(
                getattr(self.client, method)(url, {}, format="json").status_code, 403
            )

    @override_settings(CORS_ALLOWED_ORIGINS=["https://frontend.example.test"])
    def test_cors_uses_exact_origin_not_wildcard(self):
        self.client.force_authenticate(self.user)
        good = self.client.get(
            "/api/pacientes", HTTP_ORIGIN="https://frontend.example.test"
        )
        self.assertEqual(
            good["access-control-allow-origin"], "https://frontend.example.test"
        )
        bad = self.client.get("/api/pacientes", HTTP_ORIGIN="https://evil.example.test")
        self.assertNotIn("access-control-allow-origin", bad)

    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_production_transport_redirect_and_https_response(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/pacientes").status_code, 301)
        self.assertEqual(
            self.client.get("/api/pacientes", secure=True).status_code, 200
        )

    def test_no_clinical_write_routes_or_unsafe_methods(self):
        self.client.force_authenticate(self.user)
        for url in ["/api/notas", f"/api/notas/{self.note.pk}/versiones"]:
            self.assertEqual(self.client.post(url, {}, format="json").status_code, 404)
        for method in ["put", "delete"]:
            for url in [
                f"/api/pacientes/{self.patient.pk}",
                f"/api/notas/{self.note.pk}",
            ]:
                self.assertEqual(
                    getattr(self.client, method)(url, {}, format="json").status_code,
                    405,
                )
