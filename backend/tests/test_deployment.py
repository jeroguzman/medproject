from unittest.mock import patch

from django.db import DatabaseError
from django.test import TestCase, override_settings


class DeploymentTests(TestCase):
    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_readiness_is_public_without_redirect_or_clinical_content(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_readiness_reports_database_unavailable_without_details(self):
        with patch(
            "vozclinica.health.connection.cursor",
            side_effect=DatabaseError("private-detail"),
        ):
            response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"ok": False})
        self.assertNotIn("private-detail", response.content.decode())

    @override_settings(
        SECURE_SSL_REDIRECT=True,
        SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
    )
    def test_trusted_https_proxy_does_not_loop_redirect(self):
        response = self.client.get("/api/pacientes", HTTP_X_FORWARDED_PROTO="https")
        self.assertEqual(response.status_code, 401)

    @override_settings(SECURE_SSL_REDIRECT=True, SECURE_PROXY_SSL_HEADER=None)
    def test_untrusted_proxy_header_does_not_bypass_https(self):
        response = self.client.get("/api/pacientes", HTTP_X_FORWARDED_PROTO="https")
        self.assertEqual(response.status_code, 301)
