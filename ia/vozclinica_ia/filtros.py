"""VC-12: normalización mínima y validación literal de evidencia.

Pendiente para VC-13: semáforos clínicos completos, alergias y controles de
identidad. Coincidencia textual NO comprueba fidelidad semántica.
"""
from __future__ import annotations

import copy
import unicodedata
import re
from typing import Any
from jsonschema import Draft202012Validator
from .esquema import cargar, contenido_vacio, validar


def _texto_norm(txt: str) -> str:
    t = unicodedata.normalize("NFD", txt.casefold())
    t = "".join(ch for ch in t if unicodedata.category(ch) != "Mn")
    return " ".join(re.findall(r"[\w]+", t, re.UNICODE))


def _evidencia_valida(evidencia: Any, transcripcion: str) -> bool:
    if not isinstance(evidencia, list) or not evidencia:
        return False
    completo = _texto_norm(transcripcion)
    return all(isinstance(e, str) and len(_texto_norm(e)) >= 3 and _texto_norm(e) in completo for e in evidencia)


def _alerta(tipo: str, campo: str, mensaje: str) -> dict:
    return {"tipo": tipo, "severidad": "info", "campo": campo,
            "mensaje": mensaje, "bloquea": False}


def aplicar(borrador: dict, transcripcion: dict, paciente: dict | None, modo: str) -> tuple[dict, list[dict]]:
    if modo not in {"dictado", "consulta"}:
        raise ValueError("modo inválido")
    if not isinstance(borrador, dict):
        borrador = {}
    schema = cargar()
    defs = schema["$defs"]
    secciones_base = contenido_vacio()
    raw_sections = borrador.get("secciones") if isinstance(borrador.get("secciones"), dict) else {}
    texto = transcripcion.get("texto", "") if isinstance(transcripcion, dict) else ""
    alertas = []
    for sec, campos in secciones_base.items():
        rawsec = raw_sections.get(sec)
        if not isinstance(rawsec, dict):
            continue
        for campo in campos:
            original = rawsec.get(campo)
            if original is None:
                continue
            field_schema = defs["secciones"]["properties"][sec]["properties"][campo]
            ruta = f"{sec}.{campo}"
            if field_schema.get("type") == "array":
                if not isinstance(original, list):
                    alertas.append(_alerta("valor_invalido", ruta, "La lista no era válida y se descartó"))
                    continue
                item_schema = field_schema["items"]["$ref"].split("/")[-1]
                for i, item in enumerate(original):
                    ruta_item = f"{ruta}[{i}]"
                    valid = not list(Draft202012Validator({"$defs": defs, "$ref": f"#/$defs/{item_schema}"}).iter_errors(item)) if isinstance(item, dict) else False
                    if valid and _evidencia_valida(item.get("evidencia"), texto):
                        campos[campo].append({k: v for k, v in item.items() if k != "origen"})
                    else:
                        alertas.append(_alerta("sin_evidencia", ruta_item, "Elemento descartado: formato o evidencia inválida"))
                continue
            tipo = field_schema["$ref"].split("/")[-1]
            if not isinstance(original, dict):
                alertas.append(_alerta("valor_invalido", ruta, "Campo descartado: no era objeto"))
                continue
            # El LLM no debe fijar origen: lo controla frontend.
            item = {k: v for k, v in original.items() if k != "origen"}
            if list(Draft202012Validator({"$defs": defs, "$ref": f"#/$defs/{tipo}"}).iter_errors(item)):
                alertas.append(_alerta("valor_invalido", ruta, "Campo descartado: formato inválido"))
                continue
            estado = item.get("estado")
            if estado == "sin_informacion" or item.get("valor") is None:
                continue
            if not _evidencia_valida(item.get("evidencia"), texto):
                alertas.append(_alerta("sin_evidencia", ruta, "Campo descartado: cita ausente en la transcripción"))
                continue
            campos[campo] = item
    roles = borrador.get("hablantes") if isinstance(borrador.get("hablantes"), dict) else {}
    roles = {k: v for k, v in roles.items() if re.fullmatch(r"HABLANTE_\d+", k) and v in {"medico", "paciente", "acompanante", "desconocido"}}
    if modo == "dictado":
        roles = {"HABLANTE_1": "medico"}
    nombre = borrador.get("paciente_mencionado")
    nombre = nombre.strip() if isinstance(nombre, str) and nombre.strip() else None
    normalizado = {
        "plantilla": "formato_clinico_general",
        "version": "1.1",
        "modo_captura": modo,
        "paciente_mencionado": nombre,
        "hablantes": roles,
        "secciones": secciones_base,
        "alertas": alertas,
    }
    errores = validar(normalizado)
    if errores:
        raise ValueError("Error interno de normalización: " + "; ".join(errores[:3]))
    return normalizado, alertas
