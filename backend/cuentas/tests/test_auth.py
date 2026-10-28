from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from cuentas.models import Medico
from tests.contracts import assert_schema
from tests.helpers import medico


class AuthGateTests(APITestCase):
    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)
        assert_schema(self, "Error", response.json())

    def test_invalid_login_rejected(self):
        response = self.client.post(
            "/api/auth/login",
            {"usuario": "missing", "contrasena": "incorrect"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["codigo"], "credenciales_invalidas")


class AuthTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()

    def login(self, **extra):
        payload = {"usuario": "doctor", "contrasena": "clave-ficticia-tests-2026"}
        payload.update(extra)
        return self.client.post("/api/auth/login", payload, format="json")

    def test_login_and_me_contract(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        assert_schema(self, "LoginRespuesta", response.json())
        token = AccessToken(response.json()["access"])
        self.assertEqual(token["user_id"], str(self.user.pk))
        self.assertAlmostEqual(token["exp"] - token["iat"], 12 * 3600, delta=1)
        self.assertNotIn("nombre_completo", token.payload)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + str(token))
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 200)
        assert_schema(self, "Medico", response.json())
        self.assertEqual(response.json()["id"], self.profile.pk)

    def test_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.login().status_code, 401)

    def test_user_without_profile(self):
        user = get_user_model().objects.create_user(
            username="no_profile", password="clave-ficticia-tests-2026"
        )
        self.assertEqual(self.login(usuario=user.username).status_code, 403)
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + str(AccessToken.for_user(user))
        )
        self.assertEqual(self.client.get("/api/auth/me").status_code, 403)

    def test_expired_and_tampered_tokens(self):
        token = AccessToken.for_user(self.user)
        token.set_exp(
            from_time=timezone.now() - timedelta(days=1), lifetime=timedelta(seconds=1)
        )
        for encoded in [str(token), str(AccessToken.for_user(self.user)) + "invalid"]:
            self.client.credentials(HTTP_AUTHORIZATION="Bearer " + encoded)
            self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_invalid_input(self):
        for data in [
            {},
            {"usuario": "doctor"},
            {"usuario": "doctor", "contrasena": "x", "access": "injected"},
        ]:
            response = self.client.post("/api/auth/login", data, format="json")
            self.assertEqual(response.status_code, 400)
            assert_schema(self, "Error", response.json())

    def test_no_remote_logout_or_refresh(self):
        for url in ["/api/auth/logout", "/api/auth/refresh"]:
            self.assertEqual(self.client.post(url, {}, format="json").status_code, 404)

    def test_demo_doctors_idempotent_and_preserves_changes(self):
        with patch.dict("os.environ", {"DEMO_PASSWORD": "clave-ficticia-tests-2026"}):
            call_command("cargar_demo", solo_medicos=True, stdout=StringIO())
            user = get_user_model().objects.get(username="pmendez")
            original = user.password
            profile = user.medico
            profile.nombre_completo = "Cambio que debe conservarse"
            profile.save()
            call_command("cargar_demo", solo_medicos=True, stdout=StringIO())
            user.refresh_from_db()
            profile.refresh_from_db()
            self.assertEqual(user.password, original)
            self.assertEqual(profile.nombre_completo, "Cambio que debe conservarse")
            self.assertEqual(
                Medico.objects.filter(
                    usuario__username__in=["pmendez", "esalas"]
                ).count(),
                2,
            )
