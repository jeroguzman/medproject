"""Contrato JSON compartido por IA, frontend y Django.

Este módulo valida estructura; NO verifica veracidad clínica ni evidencia semántica.
"""
from functools import lru_cache
from pathlib import Path
import json
from jsonschema import Draft202012Validator

RUTA = Path(__file__).resolve().parent.parent / "esquemas" / "formato_clinico_general_v1_1.json"

@lru_cache(maxsize=1)
def cargar() -> dict:
    with RUTA.open("r", encoding="utf-8") as archivo:
        return json.load(archivo)

def _errores(instancia: dict, esquema: dict) -> list[str]:
    validador = Draft202012Validator(esquema)
    return [f"{'/'.join(str(i) for i in error.absolute_path) or '$'}: {error.message}"
            for error in sorted(validador.iter_errors(instancia), key=lambda x: (str(list(x.absolute_path)), x.message))]

def validar(datos: dict) -> list[str]:
    """Valida el borrador completo. Devuelve [] si cumple el contrato."""
    return _errores(datos, cargar())

def validar_contenido(secciones: dict) -> list[str]:
    """Valida solamente el contenido de la nota (secciones) para Django."""
    base = cargar()
    schema_local = {"$schema": base["$schema"], "$defs": base["$defs"], "$ref": "#/$defs/secciones"}
    return _errores(secciones, schema_local)

def contenido_vacio() -> dict:
    """Crea un contenido normalizado sin datos, conservando los campos del contrato."""
    base = cargar()
    defs = base["$defs"]
    salida = {}
    for nombre_seccion, seccion in defs["secciones"]["properties"].items():
        salida[nombre_seccion] = {}
        for campo, descripcion in seccion["properties"].items():
            if descripcion.get("type") == "array":
                salida[nombre_seccion][campo] = []
                continue
            tipo = descripcion["$ref"].rsplit("/", 1)[-1]
            salida[nombre_seccion][campo] = {
                "valor": None, "estado": "sin_informacion", "evidencia": None
            }
    return salida
