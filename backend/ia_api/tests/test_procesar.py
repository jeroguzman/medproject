import json
from unittest.mock import Mock, patch

import requests
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from notas.models import Nota, VersionNota
from pacientes.models import Paciente
from tests.helpers import medico, patient

URL = "/api/ia/procesar"
SECCIONES = {
    "motivo_padecimiento",
    "antecedentes",
    "interrogatorio",
    "signos_vitales",
    "exploracion_fisica",
    "estudios",
    "valoracion",
    "plan",
}
TRANSCRIPCION = {
    "texto": "Me duele mucho la garganta desde el lunes. Parece una faringitis.",
    "segmentos": [
        {
            "hablante": "HABLANTE_1",
            "texto": "Me duele mucho la garganta desde el lunes.",
            "inicio": 0.0,
            "fin": 2.5,
        },
        {
            "hablante": "HABLANTE_2",
            "texto": "Parece una faringitis.",
            "inicio": 2.6,
            "fin": 4.0,
        },
    ],
}
EXTRACCION = {
    "paciente_mencionado": None,
    "hablantes": {"HABLANTE_1": "paciente", "HABLANTE_2": "medico"},
    "secciones": {
        "motivo_padecimiento": {
            "motivo_consulta": {
                "valor": "Dolor de garganta",
                "estado": "referido",
                "evidencia": ["Me duele mucho la garganta"],
            },
            # Sin cita en la transcripción: los filtros lo descartan con alerta.
            "padecimiento_actual": {
                "valor": "Fiebre de 40 °C",
                "estado": "referido",
                "evidencia": ["tengo fiebre de cuarenta"],
            },
        }
    },
}


def audio(nombre="consulta.webm", contenido=b"audio-ficticio", tipo="audio/webm"):
    return SimpleUploadedFile(nombre, contenido, content_type=tipo)


def respuesta_n8n(status=200, datos=None):
    respuesta = Mock()
    respuesta.status_code = status
    respuesta.json.return_value = (
        datos
        if datos is not None
        else {
            "transcripcion": TRANSCRIPCION,
            "extraccion_raw": json.dumps(EXTRACCION),
            "metricas": {"duracion_audio_s": 4.0, "ms_transcripcion": None},
        }
    )
    return respuesta


@override_settings(IA_ORQUESTADOR="eco", IA_ECO_ESPERA_S=0)
class ProcesarTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()
        self.patient = patient(self.profile)
        self.client.force_authenticate(self.user)

    def procesar(self, **cambios):
        datos = {"audio": audio(), "paciente_id": self.patient.pk, "modo": "consulta"}
        datos.update(cambios)
        datos = {k: v for k, v in datos.items() if v is not None}
        return self.client.post(URL, datos, format="multipart")

    def assert_error(self, response, status, codigo):
        self.assertEqual(response.status_code, status, response.content)
        self.assertEqual(response.json()["error"]["codigo"], codigo)

    def test_eco_returns_contract_and_stores_nothing(self):
        before = (Nota.objects.count(), VersionNota.objects.count())
        response = self.procesar()
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn("no-store", response["Cache-Control"])
        body = response.json()
        self.assertEqual(
            set(body), {"transcripcion", "borrador", "alertas", "metricas"}
        )
        self.assertEqual(set(body["borrador"]["secciones"]), SECCIONES)
        self.assertEqual(body["borrador"]["modo_captura"], "consulta")
        self.assertNotIn("alertas", body["borrador"])
        self.assertIn("ms_total", body["metricas"])
        self.assertEqual(body["transcripcion"]["segmentos"][0]["rol"], "medico")
        diagnosticos = body["borrador"]["secciones"]["valoracion"]["diagnosticos"]
        self.assertEqual(
            diagnosticos[0]["descripcion"], "Faringitis, probablemente viral"
        )
        # CA-02: procesar no escribe notas ni versiones.
        self.assertEqual((Nota.objects.count(), VersionNota.objects.count()), before)

    def test_dictado_marks_single_speaker_as_doctor(self):
        body = self.procesar(modo="dictado").json()
        self.assertEqual(body["borrador"]["modo_captura"], "dictado")
        self.assertEqual(body["borrador"]["hablantes"], {"HABLANTE_1": "medico"})

    def test_requires_doctor_session(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.procesar().status_code, 401)
        sin_perfil = get_user_model().objects.create_user(
            username="sin_perfil", password="clave-ficticia-tests-2026"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + str(AccessToken.for_user(sin_perfil))
        )
        self.assertEqual(self.procesar().status_code, 403)

    def test_invalid_audio(self):
        self.assert_error(self.procesar(audio=None), 400, "audio_invalido")
        self.assert_error(
            self.procesar(audio=audio(contenido=b"")), 400, "audio_invalido"
        )
        self.assert_error(
            self.procesar(audio=audio("notas.pdf", tipo="application/pdf")),
            400,
            "audio_invalido",
        )
        # Algunos navegadores no informan el tipo de un m4a; basta la extensión.
        sin_tipo = audio("consulta.m4a", tipo="application/octet-stream")
        self.assertEqual(self.procesar(audio=sin_tipo).status_code, 200)

    @override_settings(IA_AUDIO_MAX_BYTES=10)
    def test_audio_too_large(self):
        grande = audio(contenido=b"x" * 11)
        self.assert_error(self.procesar(audio=grande), 413, "audio_muy_grande")

    @override_settings(FILE_UPLOAD_MAX_MEMORY_SIZE=100)
    def test_body_too_large_is_rejected_before_reading(self):
        grande = audio(contenido=b"x" * 200)
        self.assert_error(self.procesar(audio=grande), 413, "audio_muy_grande")

    def test_invalid_fields_and_unknown_patient(self):
        self.assert_error(self.procesar(modo="otro"), 400, "validacion")
        self.assert_error(self.procesar(paciente_id="abc"), 400, "validacion")
        self.assert_error(self.procesar(extra="x"), 400, "validacion")
        self.assert_error(self.procesar(paciente_id=999999), 404, "no_encontrado")

    @override_settings(
        IA_ORQUESTADOR="n8n",
        N8N_BASE_URL="https://n8n.example.test",
        N8N_SECRET="secreto-ficticio",
    )
    @patch("ia_api.servicio.requests.post")
    def test_n8n_sends_audio_without_patient_data_and_filters(self, post):
        post.return_value = respuesta_n8n()
        response = self.procesar()
        self.assertEqual(response.status_code, 200, response.content)
        args, kwargs = post.call_args
        self.assertEqual(args[0], "https://n8n.example.test/webhook/procesar-audio")
        self.assertEqual(kwargs["headers"]["X-MedVox-Secret"], "secreto-ficticio")
        self.assertEqual(kwargs["data"]["modo"], "consulta")
        self.assertIn("consulta", kwargs["data"]["prompt"])
        self.assertEqual(kwargs["files"]["audio"][1], b"audio-ficticio")
        enviado = json.dumps(kwargs["data"], ensure_ascii=False)
        for dato in ["María Fernanda", "García", "Penicilina", str(self.patient.pk)]:
            self.assertNotIn(dato, enviado)
        body = response.json()
        motivo = body["borrador"]["secciones"]["motivo_padecimiento"]
        self.assertEqual(motivo["motivo_consulta"]["valor"], "Dolor de garganta")
        self.assertEqual(motivo["padecimiento_actual"]["estado"], "sin_informacion")
        self.assertEqual(
            [a["campo"] for a in body["alertas"]],
            ["motivo_padecimiento.padecimiento_actual"],
        )
        self.assertEqual(
            [s["rol"] for s in body["transcripcion"]["segmentos"]],
            ["paciente", "medico"],
        )
        self.assertEqual(body["metricas"]["duracion_audio_s"], 4.0)
        self.assertNotIn("ms_transcripcion", body["metricas"])
        self.assertEqual(Paciente.objects.count(), 1)

    @override_settings(
        IA_ORQUESTADOR="n8n",
        N8N_BASE_URL="https://n8n.example.test",
        N8N_SECRET="secreto-ficticio",
    )
    @patch("ia_api.servicio.requests.post")
    def test_n8n_failures_are_controlled(self, post):
        casos = [
            (requests.ReadTimeout(), 504, "ia_tiempo_agotado"),
            (requests.ConnectionError(), 502, "ia_fallo"),
            (respuesta_n8n(404, {}), 502, "ia_fallo"),
            (respuesta_n8n(500, {}), 502, "ia_fallo"),
            (respuesta_n8n(200, {"transcripcion": TRANSCRIPCION}), 502, "ia_fallo"),
            (
                respuesta_n8n(
                    200, {"transcripcion": TRANSCRIPCION, "extraccion_raw": "no-json"}
                ),
                502,
                "ia_fallo",
            ),
            (
                respuesta_n8n(
                    200,
                    {"transcripcion": {"texto": 1}, "extraccion_raw": "{}"},
                ),
                502,
                "ia_fallo",
            ),
        ]
        for resultado, status, codigo in casos:
            with self.subTest(resultado=resultado):
                if isinstance(resultado, Exception):
                    post.side_effect = resultado
                else:
                    post.side_effect = None
                    post.return_value = resultado
                self.assert_error(self.procesar(), status, codigo)

    @override_settings(
        IA_ORQUESTADOR="n8n",
        N8N_BASE_URL="https://n8n.example.test",
        N8N_SECRET="secreto-ficticio",
    )
    @patch("ia_api.servicio.requests.post")
    def test_silent_audio_is_reported(self, post):
        post.return_value = respuesta_n8n(
            200,
            {
                "transcripcion": {"texto": " ", "segmentos": []},
                "extraccion_raw": json.dumps(EXTRACCION),
            },
        )
        self.assert_error(self.procesar(), 400, "audio_invalido")

    @patch("ia_api.servicio.requests.post")
    def test_n8n_without_configuration(self, post):
        configuraciones = [
            {"N8N_BASE_URL": "", "N8N_SECRET": "secreto"},
            {"N8N_BASE_URL": "https://n8n.example.test", "N8N_SECRET": ""},
            {
                "N8N_BASE_URL": "http://n8n.example.test",
                "N8N_SECRET": "x",
                "DEBUG": False,
            },
        ]
        for valores in configuraciones:
            with (
                self.subTest(valores=valores),
                self.settings(IA_ORQUESTADOR="n8n", **valores),
            ):
                self.assert_error(self.procesar(), 503, "ia_no_configurada")
        post.assert_not_called()

    @override_settings(IA_ORQUESTADOR="django")
    @patch.dict(
        "os.environ",
        {"ELEVENLABS_API_KEY": "ficticia", "BACKBOARD_API_KEY": "ficticia"},
    )
    @patch("ia_api.servicio.extraccion.extraer", return_value=EXTRACCION)
    @patch("ia_api.servicio.stt.transcribir", return_value=TRANSCRIPCION)
    def test_django_mode_calls_ia_package(self, transcribir, extraer):
        response = self.procesar(modo="dictado")
        self.assertEqual(response.status_code, 200, response.content)
        transcribir.assert_called_once_with(
            b"audio-ficticio", "consulta.webm", "dictado"
        )
        self.assertEqual(extraer.call_args.args[1], "dictado")
        metricas = response.json()["metricas"]
        self.assertEqual(metricas["duracion_audio_s"], 4.0)
        self.assertIn("ms_transcripcion", metricas)

    @override_settings(IA_ORQUESTADOR="django")
    @patch.dict(
        "os.environ",
        {"ELEVENLABS_API_KEY": "ficticia", "BACKBOARD_API_KEY": "ficticia"},
    )
    @patch("ia_api.servicio.stt.transcribir")
    def test_django_mode_failures(self, transcribir):
        from medvox_ia.stt import ErrorTranscripcion

        transcribir.side_effect = ErrorTranscripcion("Falta clave en PowerShell")
        response = self.procesar()
        self.assert_error(response, 502, "ia_fallo")
        self.assertNotIn("PowerShell", response.content.decode())

    @override_settings(IA_ORQUESTADOR="django")
    @patch.dict("os.environ", {"ELEVENLABS_API_KEY": "", "BACKBOARD_API_KEY": ""})
    @patch("ia_api.servicio.stt.transcribir")
    def test_django_mode_without_keys(self, transcribir):
        self.assert_error(self.procesar(), 503, "ia_no_configurada")
        transcribir.assert_not_called()
