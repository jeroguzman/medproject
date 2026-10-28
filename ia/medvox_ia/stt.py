"""VC-10: transcripción de audio con ElevenLabs Scribe v2.

Contrato con Jeroben (docs/equipo/luis-ia.md):
  transcribir(audio: bytes, nombre_archivo: str, modo: str) -> {texto, segmentos}
  formatear_para_llm(transcripcion: dict) -> str

No almacena audio; la capa que invoca decide si almacena la transcripción.
Usar únicamente grabaciones ficticias durante el hackatón.
"""
from __future__ import annotations

import mimetypes
import os
from typing import Any

import requests

ENDPOINT = "https://api.elevenlabs.io/v1/speech-to-text"


class ErrorTranscripcion(Exception):
    """Error controlado de transcripción (sin exponer credenciales)."""


def _unir_tokens(tokens: list[dict[str, Any]]) -> str:
    """Reconstruye texto respetando espacios y puntuación del modelo."""
    resultado = ""
    for token in tokens:
        pieza = str(token.get("text") or "")
        if not pieza or token.get("type") == "audio_event":
            continue
        if token.get("type") == "spacing":
            resultado += pieza
            continue
        if (resultado
                and not resultado[-1].isspace()
                and not resultado.endswith(("(", "¿", "¡", "-", "/"))
                and not pieza.startswith((" ", ".", ",", ":", ";", "!", "?", ")"))):
            resultado += " "
        resultado += pieza
    return resultado.strip()


def normalizar_respuesta(respuesta: dict[str, Any], modo: str) -> dict[str, Any]:
    """Adapta la respuesta de Scribe al contrato de MedVox.

    HABLANTE_1/2 designan turnos acústicos, NO roles clínicos verificados.
    """
    if modo not in {"dictado", "consulta"}:
        raise ValueError("modo debe ser 'dictado' o 'consulta'")
    texto = respuesta.get("text")
    if not isinstance(texto, str):
        raise ErrorTranscripcion("ElevenLabs no devolvió el campo text.")
    palabras = respuesta.get("words") or []
    if not isinstance(palabras, list):
        raise ErrorTranscripcion("ElevenLabs devolvió words con formato inválido.")

    grupos: list[dict[str, Any]] = []
    etiquetas: dict[str, str] = {}
    actual_tokens: list[dict[str, Any]] = []
    actual_hablante: str | None = None
    inicio = fin = None

    def guardar() -> None:
        fragmento = _unir_tokens(actual_tokens)
        if fragmento and actual_hablante is not None:
            grupos.append({"hablante": actual_hablante, "texto": fragmento,
                           "inicio": inicio, "fin": fin})

    for palabra in palabras:
        if not isinstance(palabra, dict) or palabra.get("type") == "audio_event":
            continue
        if palabra.get("type") == "spacing":
            if actual_tokens:
                actual_tokens.append(palabra)
            continue
        ident = str(palabra.get("speaker_id") or "speaker_0") if modo == "consulta" else "speaker_0"
        if ident not in etiquetas:
            etiquetas[ident] = f"HABLANTE_{len(etiquetas) + 1}"
        hablante = etiquetas[ident]
        if actual_hablante is not None and hablante != actual_hablante:
            guardar()
            actual_tokens = []
            inicio = fin = None
        if not actual_tokens:
            inicio = palabra.get("start")
        actual_hablante = hablante
        fin = palabra.get("end", fin)
        actual_tokens.append(palabra)
    guardar()

    if not grupos and texto.strip():
        grupos = [{"hablante": "HABLANTE_1", "texto": texto.strip(),
                   "inicio": None, "fin": None}]
    return {"texto": texto.strip(), "segmentos": grupos}


def formatear_para_llm(transcripcion: dict[str, Any]) -> str:
    segmentos = transcripcion.get("segmentos") or []
    return "\n".join(f'{s["hablante"]}: {s["texto"]}' for s in segmentos)


def transcribir(audio: bytes, nombre_archivo: str, modo: str) -> dict[str, Any]:
    """Llama a Scribe v2 y retorna texto/segmentos. No imprime la clave de API."""
    if modo not in {"dictado", "consulta"}:
        raise ValueError("modo debe ser 'dictado' o 'consulta'")
    if not audio:
        raise ValueError("El audio está vacío")
    clave = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not clave:
        raise ErrorTranscripcion("Falta ELEVENLABS_API_KEY en el entorno de PowerShell.")
    modelo = os.getenv("ELEVENLABS_MODEL_ID", "scribe_v2")
    tipo = mimetypes.guess_type(nombre_archivo)[0] or "application/octet-stream"
    datos = {
        "model_id": modelo,
        "language_code": "es",
        "diarize": "true" if modo == "consulta" else "false",
        "tag_audio_events": "false",
    }
    try:
        respuesta = requests.post(
            ENDPOINT,
            headers={"xi-api-key": clave},
            data=datos,
            files={"file": (nombre_archivo, audio, tipo)},
            timeout=120,
        )
        respuesta.raise_for_status()
        contenido = respuesta.json()
    except requests.exceptions.HTTPError as exc:
        codigo = exc.response.status_code if exc.response is not None else "desconocido"
        raise ErrorTranscripcion(f"ElevenLabs devolvió HTTP {codigo}; revisa clave, permisos, créditos y audio.") from exc
    except (requests.exceptions.RequestException, ValueError) as exc:
        raise ErrorTranscripcion(f"No fue posible transcribir: {type(exc).__name__}.") from exc
    if not isinstance(contenido, dict):
        raise ErrorTranscripcion("ElevenLabs no devolvió un objeto JSON.")
    return normalizar_respuesta(contenido, modo)
