"""Orquestación de POST /api/ia/procesar (VC-14).

No guarda nada (D-02): ni audio, ni transcripción, ni borrador. Los datos del
paciente solo se usan en los filtros de Django; nunca se envían a n8n ni a la IA.
"""

import json
import os
import time

import requests
from django.conf import settings
from medvox_ia import extraccion, filtros, stt

MENSAJE_FALLO = (
    "El servicio de IA no respondió bien. Tu audio sigue aquí: puedes reintentar."
)


class ErrorProcesamiento(Exception):
    def __init__(self, status, codigo, mensaje):
        super().__init__(mensaje)
        self.status = status
        self.codigo = codigo
        self.mensaje = mensaje


def fallo(mensaje=MENSAJE_FALLO):
    return ErrorProcesamiento(502, "ia_fallo", mensaje)


def no_configurada():
    return ErrorProcesamiento(
        503,
        "ia_no_configurada",
        "El procesamiento con IA no está configurado en el servidor. "
        "Avisa al administrador; tu audio sigue aquí.",
    )


def sin_voz():
    return ErrorProcesamiento(
        400,
        "audio_invalido",
        "No se detectó voz en el audio. Revisa el micrófono y vuelve a grabar.",
    )


def procesar(*, audio, nombre, tipo, modo, paciente):
    inicio = time.monotonic()
    if settings.IA_ORQUESTADOR == "n8n":
        transcripcion, crudo, metricas = con_n8n(audio, nombre, tipo, modo)
    elif settings.IA_ORQUESTADOR == "django":
        transcripcion, crudo, metricas = con_django(audio, nombre, modo)
    else:
        transcripcion, crudo, metricas = eco(modo)
    try:
        borrador, alertas = filtros.aplicar(
            crudo, transcripcion, datos_paciente(paciente), modo
        )
    except ValueError as exc:
        raise fallo() from exc
    borrador.pop("alertas", None)  # Se devuelven una sola vez, fuera del borrador.
    for segmento in transcripcion["segmentos"]:
        segmento["rol"] = borrador["hablantes"].get(segmento["hablante"], "desconocido")
    metricas = {k: v for k, v in metricas.items() if es_numero(v)}
    metricas["ms_total"] = round((time.monotonic() - inicio) * 1000)
    return {
        "transcripcion": transcripcion,
        "borrador": borrador,
        "alertas": alertas,
        "metricas": metricas,
    }


def con_n8n(audio, nombre, tipo, modo):
    base = settings.N8N_BASE_URL
    seguro = base.startswith("https://") or (
        settings.DEBUG and base.startswith("http://")
    )
    if not seguro or not settings.N8N_SECRET:
        raise no_configurada()
    try:
        respuesta = requests.post(
            base + "/webhook/procesar-audio",
            headers={
                "X-MedVox-Secret": settings.N8N_SECRET,
                "Accept": "application/json",
            },
            data={
                "modo": modo,
                "prompt": extraccion.prompt_sistema(modo),
                "keyterms": json.dumps(extraccion.keyterms(), ensure_ascii=False),
            },
            files={"audio": (nombre, audio, tipo)},
            timeout=(5, settings.IA_TIMEOUT_S),
            allow_redirects=False,
        )
    except requests.ReadTimeout as exc:
        raise ErrorProcesamiento(
            504,
            "ia_tiempo_agotado",
            "El procesamiento tardó demasiado. Tu audio sigue aquí: puedes reintentar.",
        ) from exc
    except requests.RequestException as exc:
        raise fallo() from exc
    if respuesta.status_code in (401, 403, 404):
        # Credencial distinta o workflow inactivo: lo corrige el administrador.
        raise fallo(
            "El flujo de IA en n8n rechazó la petición o no está activo. "
            "Avisa al administrador; tu audio sigue aquí."
        )
    if respuesta.status_code != 200:
        raise fallo()
    try:
        datos = respuesta.json()
        crudo = extraccion.parsear(datos["extraccion_raw"])
    except (ValueError, TypeError, KeyError, extraccion.ErrorIA) as exc:
        raise fallo() from exc
    transcripcion = transcripcion_valida(datos.get("transcripcion"))
    metricas = datos.get("metricas")
    return transcripcion, crudo, metricas if isinstance(metricas, dict) else {}


def con_django(audio, nombre, modo):
    claves = ("ELEVENLABS_API_KEY", "BACKBOARD_API_KEY")
    if not all(os.environ.get(clave, "").strip() for clave in claves):
        raise no_configurada()
    t0 = time.monotonic()
    try:
        transcripcion = transcripcion_valida(stt.transcribir(audio, nombre, modo))
    except stt.ErrorTranscripcion as exc:
        raise fallo() from exc
    t1 = time.monotonic()
    try:
        crudo = extraccion.extraer(transcripcion, modo)
    except extraccion.ErrorIA as exc:
        raise fallo() from exc
    metricas = {
        "ms_transcripcion": round((t1 - t0) * 1000),
        "ms_extraccion": round((time.monotonic() - t1) * 1000),
    }
    fines = [s["fin"] for s in transcripcion["segmentos"] if "fin" in s]
    if fines:
        metricas["duracion_audio_s"] = max(fines)
    return transcripcion, crudo, metricas


def eco(modo):
    """Transcripción simulada del caso 01 y su borrador de ejemplo; ignora el audio."""
    time.sleep(settings.IA_ECO_ESPERA_S)
    raiz = extraccion.ROOT
    transcripcion = json.loads(
        (raiz / "casos/caso_01_faringitis/transcripcion_simulada.json").read_text(
            encoding="utf-8"
        )
    )
    crudo = json.loads(
        (raiz / "esquemas/ejemplos/procesar_faringitis.json").read_text(
            encoding="utf-8"
        )
    )
    return transcripcion_valida(transcripcion), crudo, {}


def transcripcion_valida(valor):
    """Copia solo los campos del contrato; un formato inesperado es un fallo de la IA."""
    if (
        not isinstance(valor, dict)
        or not isinstance(valor.get("texto"), str)
        or not isinstance(valor.get("segmentos"), list)
    ):
        raise fallo()
    segmentos = []
    for original in valor["segmentos"]:
        if (
            not isinstance(original, dict)
            or not isinstance(original.get("hablante"), str)
            or not isinstance(original.get("texto"), str)
        ):
            raise fallo()
        segmento = {"hablante": original["hablante"], "texto": original["texto"]}
        for clave in ("inicio", "fin"):
            if es_numero(original.get(clave)):
                segmento[clave] = original[clave]
        segmentos.append(segmento)
    if not valor["texto"].strip():
        raise sin_voz()
    return {"texto": valor["texto"], "segmentos": segmentos}


def datos_paciente(paciente):
    return {
        "nombres": paciente.nombres,
        "apellido_paterno": paciente.apellido_paterno,
        "apellido_materno": paciente.apellido_materno,
        "fecha_nacimiento": paciente.fecha_nacimiento.isoformat(),
        "alergias": paciente.alergias,
    }


def es_numero(valor):
    return isinstance(valor, (int, float)) and not isinstance(valor, bool)
