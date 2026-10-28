"""Administrative import of reviewed synthetic fixtures; never clinical API writes."""

import json
import re
from copy import deepcopy
from datetime import date, time
from pathlib import Path

from django.core.management.base import CommandError
from django.utils.dateparse import parse_datetime
from django.utils.timezone import is_aware
from jsonschema import Draft202012Validator, SchemaError
from medvox_ia.esquema import cargar, validar_contenido

from notas.models import Nota, Plantilla, VersionNota
from pacientes.models import Paciente

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "demo" / "notas.json"


def preparar_notas():
    """Validate the entire fixture before any users, patients or notes are written."""
    try:
        schema = deepcopy(cargar())
        Draft202012Validator.check_schema(schema)
        fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
        if fixture["plantilla"] != {
            "clave": "formato_clinico_general",
            "version": "1.1",
        }:
            raise ValueError("plantilla")
        records = fixture["notas"]
        if not isinstance(records, list) or not records:
            raise ValueError("notas")
        identities = set()
        for record in records:
            identity = (
                record["paciente_expediente"],
                record["medico_usuario"],
                record["fecha_consulta"],
                record["hora_atencion"],
            )
            if identity in identities or not re.fullmatch(
                r"\d{4}-\d{4}", record["paciente_expediente"]
            ):
                raise ValueError("identidad")
            identities.add(identity)
            date.fromisoformat(record["fecha_consulta"])
            time.fromisoformat(record["hora_atencion"])
            if record["tipo_consulta"] not in ("primera_vez", "seguimiento") or record[
                "modo_captura"
            ] not in ("dictado", "consulta"):
                raise ValueError("atencion")
            if not isinstance(record["consentimiento_grabacion"], bool):
                raise ValueError("consentimiento")
            if (
                record["modo_captura"] == "consulta"
                and not record["consentimiento_grabacion"]
            ):
                raise ValueError("consentimiento")
            versions = record["versiones"]
            if not versions or [v["numero"] for v in versions] != list(
                range(1, len(versions) + 1)
            ):
                raise ValueError("versiones")
            if record["version_vigente"] != len(versions):
                raise ValueError("version_vigente")
            if record["estado"] != (
                "autorizada" if len(versions) == 1 else "corregida"
            ):
                raise ValueError("estado")
            for version in versions:
                if validar_contenido(version["contenido"]):
                    raise ValueError("contenido")
                timestamp = parse_datetime(version["autorizada_en"])
                if timestamp is None or not is_aware(timestamp):
                    raise ValueError("autorizada_en")
                if version["numero"] > 1 and not version["motivo_cambio"].strip():
                    raise ValueError("motivo_cambio")
                if version["transcripcion"] is not None:
                    raise ValueError(
                        "Las fixtures manuales no incluyen audio o transcripción."
                    )
        return schema, records
    except (OSError, ValueError, KeyError, TypeError, SchemaError) as exc:
        # Do not copy clinical content into logs or command errors.
        raise CommandError(
            "El esquema o las notas de demo son inválidos; no se modificó la base."
        ) from exc


def comprobar_plantilla(schema):
    existing = Plantilla.objects.filter(
        clave="formato_clinico_general", version="1.1"
    ).first()
    if existing is not None and existing.esquema != schema:
        raise CommandError(
            "La plantilla 1.1 existente difiere del contrato compartido; no se sobrescribirá."
        )


def cargar_notas(schema, records, medicos):
    """Called inside the command's atomic transaction and administrative lock."""
    template, _ = Plantilla.objects.get_or_create(
        clave="formato_clinico_general", version="1.1", defaults={"esquema": schema}
    )
    profiles = {m.usuario.username: m for m in medicos}
    created = 0
    try:
        for record in records:
            profile = profiles[record["medico_usuario"]]
            patient = Paciente.objects.get(
                numero_expediente=record["paciente_expediente"]
            )
            note, new = Nota.objects.get_or_create(
                paciente=patient,
                medico=profile,
                plantilla=template,
                fecha_consulta=date.fromisoformat(record["fecha_consulta"]),
                hora_atencion=time.fromisoformat(record["hora_atencion"]),
                defaults={
                    k: record[k]
                    for k in (
                        "tipo_consulta",
                        "modo_captura",
                        "consentimiento_grabacion",
                        "estado",
                        "version_vigente",
                    )
                },
            )
            if not new:
                # Preserve previous content, later corrections and manual records.
                continue
            for version in record["versiones"]:
                row = VersionNota(
                    nota=note,
                    numero=version["numero"],
                    contenido=deepcopy(version["contenido"]),
                    transcripcion=None,
                    autorizada_por=profiles[version["autorizada_por"]],
                    autorizada_en=parse_datetime(version["autorizada_en"]),
                    motivo_cambio=version["motivo_cambio"],
                )
                row.full_clean()
                row.save()
            created += 1
    except (KeyError, Paciente.DoesNotExist, Nota.MultipleObjectsReturned) as exc:
        raise CommandError(
            "La demo tiene referencias ausentes o ambiguas; no se modificó la base."
        ) from exc
    return created
