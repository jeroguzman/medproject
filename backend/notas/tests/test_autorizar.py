from copy import deepcopy
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from medvox_ia.esquema import contenido_vacio
from rest_framework.test import APITestCase

from notas.models import Nota, Plantilla, VersionNota
from tests.contracts import assert_schema
from tests.helpers import medico, patient

URL = "/api/notas"


def campo(valor, origen="ia"):
    return {
        "valor": valor,
        "estado": "referido",
        "evidencia": ["Me duele mucho la garganta"],
        "origen": origen,
    }


def contenido_valido():
    contenido = contenido_vacio()
    contenido["motivo_padecimiento"]["motivo_consulta"] = campo("Dolor de garganta")
    contenido["motivo_padecimiento"]["padecimiento_actual"] = campo(
        "Dolor de garganta y fiebre desde el lunes.", "editado"
    )
    contenido["valoracion"]["diagnosticos"] = [
        {
            "descripcion": "Faringitis, probablemente viral",
            "condicion": "presuntivo",
            "cie10": None,
            "evidencia": None,
            "origen": "manual",
        }
    ]
    contenido["plan"]["medidas_seguimiento"] = campo("Volver si persiste la fiebre.")
    return contenido


class AutorizarNotaTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()
        self.patient = patient(self.profile)
        self.client.force_authenticate(self.user)

    def datos(self, **cambios):
        datos = {
            "paciente_id": self.patient.pk,
            "plantilla": {"clave": "formato_clinico_general", "version": "1.1"},
            "fecha_consulta": timezone.localdate().isoformat(),
            "hora_atencion": "10:30",
            "tipo_consulta": "primera_vez",
            "modo_captura": "consulta",
            "consentimiento_grabacion": True,
            "contenido": contenido_valido(),
            "transcripcion": {
                "texto": "Me duele mucho la garganta.",
                "segmentos": [
                    {
                        "hablante": "HABLANTE_2",
                        "rol": "paciente",
                        "texto": "Me duele mucho la garganta.",
                        "inicio": 1.0,
                        "fin": 2.5,
                        "audio": 1,
                    }
                ],
            },
        }
        datos.update(cambios)
        return datos

    def autorizar(self, **cambios):
        return self.client.post(URL, self.datos(**cambios), format="json")

    def assert_faltantes(self, response, faltantes):
        self.assertEqual(response.status_code, 400, response.content)
        error = response.json()["error"]
        self.assertEqual(error["codigo"], "validacion")
        self.assertEqual(sorted(error["faltantes"]), sorted(faltantes))
        self.assertFalse(Nota.objects.exists())

    def test_authorizes_note_with_version_1(self):
        # CA-07: la nota y su versión 1 nacen juntas y aparecen en el historial.
        datos = self.datos()
        response = self.client.post(URL, datos, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        body = response.json()
        assert_schema(self, "NotaDetalle", body)
        self.assertEqual(body["estado"], "autorizada")
        self.assertEqual(body["version_vigente"], 1)
        self.assertEqual(body["medico"]["id"], self.profile.pk)
        self.assertEqual(body["paciente"]["id"], self.patient.pk)
        self.assertEqual(body["paciente"]["total_notas"], 1)
        version = body["versiones"][0]
        self.assertEqual(version["numero"], 1)
        self.assertEqual(version["contenido"], datos["contenido"])
        self.assertEqual(version["transcripcion"], datos["transcripcion"])
        self.assertEqual(version["autorizada_por"], "Dra. Prueba")
        self.assertIsNone(version["motivo_cambio"])
        historial = self.client.get(f"/api/pacientes/{self.patient.pk}/notas").json()
        self.assertEqual([n["id"] for n in historial], [body["id"]])
        self.assertEqual(
            historial[0]["diagnostico_principal"], "Faringitis, probablemente viral"
        )
        self.assertEqual(Plantilla.objects.count(), 1)

    def test_author_is_always_the_session_doctor(self):
        _, otro = medico("otro")
        response = self.autorizar(medico_id=otro.pk)
        self.assert_faltantes(response, ["medico_id"])
        self.assertEqual(self.autorizar().json()["medico"]["id"], self.profile.pk)

    def test_missing_required_fields_are_reported(self):
        # CA-06 y P-04, con las mismas rutas que usa el frontend.
        sin_dx = contenido_valido()
        sin_dx["valoracion"]["diagnosticos"] = []
        self.assert_faltantes(
            self.autorizar(contenido=sin_dx), ["valoracion.diagnosticos"]
        )
        vacio = contenido_valido()
        vacio["motivo_padecimiento"]["motivo_consulta"]["valor"] = "   "
        vacio["motivo_padecimiento"]["padecimiento_actual"] = {
            "valor": None,
            "estado": "sin_informacion",
            "evidencia": None,
        }
        vacio["plan"]["medidas_seguimiento"]["valor"] = ""
        self.assert_faltantes(
            self.autorizar(contenido=vacio),
            [
                "motivo_padecimiento.motivo_consulta",
                "motivo_padecimiento.padecimiento_actual",
                "plan.medicamentos",
            ],
        )
        self.assert_faltantes(
            self.autorizar(consentimiento_grabacion=False),
            ["consentimiento_grabacion"],
        )
        self.assert_faltantes(
            self.autorizar(fecha_consulta="", hora_atencion=None),
            ["fecha_consulta", "hora_atencion"],
        )
        datos = self.datos()
        del datos["tipo_consulta"]
        response = self.client.post(URL, datos, format="json")
        self.assert_faltantes(response, ["tipo_consulta"])

    def test_plan_accepts_medication_instead_of_follow_up(self):
        contenido = contenido_valido()
        contenido["plan"]["medidas_seguimiento"] = contenido_vacio()["plan"][
            "medidas_seguimiento"
        ]
        contenido["plan"]["medicamentos"] = [
            {
                "medicamento": "Paracetamol",
                "dosis": "500 mg",
                "via": None,
                "frecuencia": "cada 8 h",
                "duracion": None,
                "evidencia": None,
                "origen": "manual",
            }
        ]
        response = self.autorizar(contenido=contenido)
        self.assertEqual(response.status_code, 201, response.content)

    def test_dictation_does_not_need_consent_or_audio(self):
        response = self.autorizar(
            modo_captura="dictado",
            consentimiento_grabacion=False,
            transcripcion={"texto": "", "segmentos": []},
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIsNone(response.json()["versiones"][0]["transcripcion"])

    def test_content_must_match_shared_schema(self):
        sin_seccion = contenido_valido()
        del sin_seccion["estudios"]
        campo_extra = deepcopy(contenido_valido())
        campo_extra["motivo_padecimiento"]["motivo_consulta"]["nota_libre"] = "x"
        for contenido in [sin_seccion, campo_extra, "texto", None]:
            with self.subTest(contenido=str(contenido)[:30]):
                response = self.autorizar(contenido=contenido)
                self.assertEqual(response.status_code, 400)
                self.assertIn("contenido", response.json()["error"]["detalles"])
        self.assertFalse(Nota.objects.exists())

    def test_rejects_invalid_context(self):
        manana = (timezone.localdate() + timedelta(days=1)).isoformat()
        casos = [
            ({"fecha_consulta": manana}, "fecha_consulta"),
            ({"plantilla": {"clave": "otra", "version": "1.1"}}, "plantilla"),
            ({"tipo_consulta": "urgencia"}, "tipo_consulta"),
            ({"transcripcion": {"texto": 1, "segmentos": []}}, "transcripcion"),
            ({"transcripcion": {"texto": "x", "segmentos": ["x"]}}, "transcripcion"),
        ]
        for cambios, campo_error in casos:
            with self.subTest(campo=campo_error):
                response = self.autorizar(**cambios)
                self.assertEqual(response.status_code, 400)
                self.assertIn(campo_error, response.json()["error"]["faltantes"])
        self.assertEqual(self.autorizar(paciente_id=999999).status_code, 404)
        self.assertFalse(Nota.objects.exists())

    def test_inactive_template_is_rejected(self):
        Plantilla.objects.create(
            clave="formato_clinico_general", version="1.1", esquema={}, activa=False
        )
        self.assertEqual(self.autorizar().status_code, 400)
        self.assertFalse(Nota.objects.exists())

    def test_failure_leaves_no_partial_note(self):
        with patch(
            "notas.services.VersionNota.objects.create",
            side_effect=RuntimeError("fallo simulado"),
        ):
            response = self.autorizar()
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("fallo simulado", response.content.decode())
        self.assertFalse(Nota.objects.exists())
        self.assertFalse(VersionNota.objects.exists())

    def test_requires_doctor_session(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.autorizar().status_code, 401)
        self.assertFalse(Nota.objects.exists())
