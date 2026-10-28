"""VC-12: extracción clínica con Backboard desde transcripción ficticia.

Interfaz estable para Django: prompt_sistema, keyterms, parsear, ErrorIA.
Cada llamada crea un hilo NUEVO, memoria apagada, sin datos de expediente.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
import requests

from .esquema import cargar

ROOT = Path(__file__).resolve().parent.parent
URL = "https://app.backboard.io/api/threads/messages"


class ErrorIA(Exception):
    pass


def keyterms() -> list[str]:
    ruta = ROOT / "keyterms.json"
    if not ruta.exists():
        return []
    data = json.loads(ruta.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not all(isinstance(x, str) for x in data):
        raise ErrorIA("keyterms.json debe ser una lista de cadenas")
    return data


def prompt_sistema(modo: str) -> str:
    if modo not in {"consulta", "dictado"}:
        raise ValueError("modo debe ser consulta o dictado")
    schema = cargar()
    secciones = schema["$defs"]["secciones"]["properties"]
    partes = []
    for sec, definition in secciones.items():
        campos = []
        for nombre, prop in definition["properties"].items():
            if prop.get("type") == "array":
                tipo = "lista"
            else:
                tipo = prop["$ref"].split("/")[-1]
            campos.append(f"{nombre} ({tipo})")
        partes.append(f"{sec}: " + ", ".join(campos))
    base = (ROOT / "prompts" / "extraccion_v1.md").read_text(encoding="utf-8")
    return base.replace("{modo}", modo).replace("{lista_de_campos}", "\n".join(partes))


def parsear(raw: str) -> dict[str, Any]:
    if not isinstance(raw, str) or not raw.strip():
        raise ErrorIA("El modelo devolvió contenido vacío")
    contenido = raw.strip()
    if contenido.startswith("```" ):
        partes = contenido.split("\n", 1)
        if len(partes) != 2 or "```" not in partes[1]:
            raise ErrorIA("Cercos markdown incompletos")
        contenido = partes[1].rsplit("```", 1)[0].strip()
    try:
        objeto = json.loads(contenido)
    except json.JSONDecodeError as exc:
        raise ErrorIA("Backboard no devolvió un JSON válido") from exc
    if not isinstance(objeto, dict):
        raise ErrorIA("La respuesta debe ser un objeto JSON")
    return objeto


def extraer(transcripcion: dict, modo: str) -> dict[str, Any]:
    """Llama a Backboard. No reutiliza hilo ni permite memoria o búsqueda web.

    La memoria está apagada, pero el hilo sigue almacenado por el proveedor;
    intentamos borrarlo al terminar. Nunca uses aquí datos reales de pacientes.
    """
    from .stt import formatear_para_llm

    clave = os.getenv("BACKBOARD_API_KEY", "").strip()
    if not clave:
        raise ErrorIA("Falta BACKBOARD_API_KEY en PowerShell")
    contenido = formatear_para_llm(transcripcion)
    if not contenido.strip():
        raise ErrorIA("No hay transcripción utilizable")
    provider = os.getenv("IA_PROVEEDOR", "openai").strip()
    model = os.getenv("IA_MODELO", "gpt-4o").strip()
    headers = {"X-API-Key": clave, "Content-Type": "application/json"}
    datos = {
        "content": "TRANSCRIPCIÓN:\n" + contenido,
        "system_prompt": prompt_sistema(modo),
        "llm_provider": provider,
        "model_name": model,
        "memory": "off",
        "web_search": "off",
        "json_output": True,
        "stream": False,
    }
    thread_id = None
    try:
        try:
            response = requests.post(URL, headers=headers, json=datos, timeout=150)
            response.raise_for_status()
            r = response.json()
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else "desconocido"
            raise ErrorIA(f"Backboard HTTP {status}; revisa permisos, créditos y nombre del modelo") from exc
        except (requests.RequestException, ValueError) as exc:
            raise ErrorIA(f"Error de comunicación con Backboard: {type(exc).__name__}") from exc
        if not isinstance(r, dict):
            raise ErrorIA("Respuesta de Backboard inválida")
        thread_id = r.get("thread_id")
        if r.get("status") not in (None, "COMPLETED"):
            raise ErrorIA(f"Backboard devolvió estado {r.get('status')}")
        return parsear(r.get("content"))
    finally:
        if thread_id:
            # Es un intento de eliminación, no una garantía de borrado.
            try:
                requests.delete(
                    "https://app.backboard.io/api/threads/" + str(thread_id),
                    headers={"X-API-Key": clave}, timeout=12,
                )
            except requests.RequestException:
                pass
