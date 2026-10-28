from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from tests.contracts import assert_schema
from tests.helpers import medico, note, patient


class PatchTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()
        self.patient = patient(self.profile)
        self.note = note(self.profile, self.patient)
        self.url = f"/api/pacientes/{self.patient.pk}"
        self.client.force_authenticate(self.user)

    def test_update_only_patient_not_historical_content(self):
        before = self.note.versiones.get(numero=1).contenido
        response = self.client.patch(
            self.url, {"nombres": "Nuevo nombre"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        assert_schema(self, "Paciente", response.json())
        self.assertEqual(
            response.json()["numero_expediente"], self.patient.numero_expediente
        )
        self.assertEqual(self.note.versiones.get(numero=1).contenido, before)

    def test_reject_readonly_and_invalid_patch(self):
        for payload in [
            {},
            {"numero_expediente": "0004-9999"},
            {"creado_por": 99},
            {"total_notas": 8},
            {"nombres": ""},
            {"sexo": "otro"},
            {"fecha_nacimiento": "2999-01-01"},
        ]:
            self.assertEqual(
                self.client.patch(self.url, payload, format="json").status_code,
                400,
                payload,
            )
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.nombres, "María Fernanda")

    def test_authentication_and_404(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.patch(
                self.url, {"nombres": "Cambio"}, format="json"
            ).status_code,
            401,
        )
        self.client.force_authenticate(self.user)
        self.assertEqual(
            self.client.patch(
                "/api/pacientes/99999", {"nombres": "Cambio"}, format="json"
            ).status_code,
            404,
        )

    def test_model_rejects_expediente_change(self):
        self.patient.numero_expediente = "0004-9999"
        with self.assertRaises(ValidationError):
            self.patient.save()
