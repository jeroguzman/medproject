import json
from copy import deepcopy
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from rest_framework.test import APIClient
from vozclinica_ia.esquema import cargar, validar_contenido

from notas.models import Nota, Plantilla, VersionNota
from pacientes.models import Paciente


class DemoNotasTests(TestCase):
    def load(self):
        with patch.dict("os.environ", {"DEMO_PASSWORD": "clave-ficticia-tests-2026"}):
            call_command("cargar_demo", stdout=StringIO())

    def test_loads_complete_shared_schema_and_corrected_note(self):
        self.load()
        self.assertEqual(Nota.objects.count(), 5)
        self.assertEqual(VersionNota.objects.count(), 6)
        self.assertEqual(
            Plantilla.objects.get(
                clave="formato_clinico_general", version="1.1"
            ).esquema,
            cargar(),
        )
        for version in VersionNota.objects.all():
            self.assertEqual(validar_contenido(version.contenido), [])
        corrected = Nota.objects.get(estado="corregida")
        self.assertEqual(corrected.version_vigente, 2)
        self.assertEqual(
            list(corrected.versiones.values_list("numero", flat=True)), [2, 1]
        )
        self.assertTrue(corrected.versiones.get(numero=2).motivo_cambio)
        self.assertNotEqual(
            corrected.versiones.get(numero=1).contenido,
            corrected.versiones.get(numero=2).contenido,
        )
        patient = Paciente.objects.get(numero_expediente="0004-8217")
        self.assertIn("Penicilina", patient.alergias)
        self.assertEqual(patient.notas.count(), 3)

    def test_repeated_import_preserves_versions_and_manual_changes(self):
        self.load()
        before = list(VersionNota.objects.order_by("id").values())
        patient = Paciente.objects.get(numero_expediente="0004-8217")
        patient.telefono = "5555555555"
        patient.save()
        self.load()
        self.assertEqual(list(VersionNota.objects.order_by("id").values()), before)
        self.assertEqual(Nota.objects.count(), 5)
        patient.refresh_from_db()
        self.assertEqual(patient.telefono, "5555555555")

    def test_real_history_and_detail_match_contract_and_clinical_schema(self):
        from tests.contracts import assert_schema

        self.load()
        client = APIClient()
        client.force_authenticate(get_user_model().objects.get(username="pmendez"))
        patient = Paciente.objects.get(numero_expediente="0004-8217")
        response = client.get(f"/api/pacientes/{patient.pk}/notas")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 3)
        for summary in response.json():
            assert_schema(self, "NotaResumen", summary)
            detail = client.get(f"/api/notas/{summary['id']}")
            self.assertEqual(detail.status_code, 200)
            assert_schema(self, "NotaDetalle", detail.json())
            for version in detail.json()["versiones"]:
                self.assertEqual(validar_contenido(version["contenido"]), [])

    def test_invalid_fixture_rolls_back_entire_load(self):
        from notas import demo

        data = json.loads(demo.FIXTURE_PATH.read_text())
        invalid = deepcopy(data)
        invalid["notas"][-1]["versiones"][0]["contenido"]["plan"]["medicamentos"] = (
            "incorrecto"
        )
        with TemporaryDirectory() as temp:
            path = Path(temp) / "notas.json"
            path.write_text(json.dumps(invalid))
            with (
                patch.object(demo, "FIXTURE_PATH", path),
                self.assertRaises(CommandError),
            ):
                self.load()
        self.assertEqual(get_user_model().objects.count(), 0)
        self.assertEqual(Paciente.objects.count(), 0)
        self.assertEqual(Nota.objects.count(), 0)

    def test_existing_different_template_is_not_overwritten(self):
        template = Plantilla.objects.create(
            clave="formato_clinico_general", version="1.1", esquema={"different": True}
        )
        with self.assertRaises(CommandError):
            self.load()
        template.refresh_from_db()
        self.assertEqual(template.esquema, {"different": True})
        self.assertEqual(Paciente.objects.count(), 0)

    def test_existing_clinical_note_is_preserved(self):
        from django.utils import timezone

        self.load()
        note = Nota.objects.get(estado="corregida")
        current = note.versiones.get(numero=2)
        VersionNota.objects.create(
            nota=note,
            numero=3,
            contenido=deepcopy(current.contenido),
            autorizada_por=note.medico,
            autorizada_en=timezone.now(),
            motivo_cambio="Corrección manual posterior",
        )
        note.version_vigente = 3
        note.save()
        self.load()
        note.refresh_from_db()
        self.assertEqual(note.version_vigente, 3)
        self.assertEqual(note.versiones.count(), 3)
