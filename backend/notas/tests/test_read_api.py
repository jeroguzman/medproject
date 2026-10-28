from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APITestCase
from tests.contracts import assert_schema
from tests.helpers import medico, note, patient

from notas.models import VersionNota


class ReadTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()
        self.patient = patient(self.profile)
        self.note = note(self.profile, self.patient)

    def test_read_requires_authentication(self):
        for path in [
            f"/api/pacientes/{self.patient.pk}/notas",
            f"/api/notas/{self.note.pk}",
        ]:
            self.assertEqual(self.client.get(path).status_code, 401)

    def test_history_uses_current_version_and_order(self):
        self.client.force_authenticate(self.user)
        VersionNota.objects.create(
            nota=self.note,
            numero=2,
            contenido={
                "valoracion": {"diagnosticos": [{"descripcion": "Corrección ficticia"}]}
            },
            autorizada_por=self.profile,
            autorizada_en=timezone.now(),
            motivo_cambio="Corrección de prueba",
        )
        self.note.estado = "corregida"
        self.note.version_vigente = 2
        self.note.save()
        newer = note(self.profile, self.patient, fecha_consulta="2026-09-01")
        response = self.client.get(f"/api/pacientes/{self.patient.pk}/notas")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual([v["id"] for v in data], [newer.pk, self.note.pk])
        for summary in data:
            assert_schema(self, "NotaResumen", summary)
        self.assertEqual(data[1]["diagnostico_principal"], "Corrección ficticia")
        self.assertEqual(
            self.client.get(f"/api/pacientes/{self.patient.pk}").json()["total_notas"],
            2,
        )

    def test_detail_contract_and_no_mutation(self):
        self.client.force_authenticate(self.user)
        before = list(VersionNota.objects.values())
        response = self.client.get(f"/api/notas/{self.note.pk}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        assert_schema(self, "NotaDetalle", data)
        self.assertEqual(data["versiones"][0]["numero"], 1)
        self.assertEqual(list(VersionNota.objects.values()), before)
        self.assertNotIn("audio", data)
        for method in [self.client.post, self.client.patch, self.client.delete]:
            self.assertEqual(
                method(f"/api/notas/{self.note.pk}", {}, format="json").status_code, 405
            )

    def test_unknown_note_and_empty_history(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/notas/99999")
        self.assertEqual(response.status_code, 404)
        assert_schema(self, "Error", response.json())
        other = patient(self.profile, numero="0004-0002")
        self.assertEqual(self.client.get(f"/api/pacientes/{other.pk}/notas").json(), [])

    def test_version_immutable_and_correction_requires_reason(self):
        version = self.note.versiones.get(numero=1)
        with self.assertRaises(ValidationError):
            version.save()
        with self.assertRaises(ValidationError):
            version.delete()
        with self.assertRaises(ValidationError):
            VersionNota.objects.filter(pk=version.pk).update(contenido={})
        with self.assertRaises(ValidationError):
            VersionNota.objects.filter(pk=version.pk).delete()
        with self.assertRaises(ValidationError):
            VersionNota.objects.create(
                nota=self.note,
                numero=2,
                contenido={},
                autorizada_por=self.profile,
                autorizada_en=timezone.now(),
                motivo_cambio="  ",
            )

    def test_raw_database_update_cannot_change_authorized_version(self):
        from django.db import IntegrityError, connection, transaction

        version = self.note.versiones.get(numero=1)
        with (
            self.assertRaises(IntegrityError),
            transaction.atomic(),
            connection.cursor() as cursor,
        ):
            cursor.execute(
                "UPDATE notas_versionnota SET motivo_cambio = %s WHERE id = %s",
                ["Cambio prohibido", version.pk],
            )
        version.refresh_from_db()
        self.assertEqual(version.motivo_cambio, "")
