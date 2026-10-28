"""Autorización de notas (POST /api/notas): el único punto que escribe en el expediente."""

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from vozclinica_ia.esquema import cargar, validar_contenido

from notas.models import Nota, Plantilla, VersionNota

PLANTILLA = {"clave": "formato_clinico_general", "version": "1.1"}
OBLIGATORIO = "Es obligatorio para autorizar la nota."


def con_valor(campo):
    valor = campo.get("valor") if isinstance(campo, dict) else None
    return valor.strip() != "" if isinstance(valor, str) else valor is not None


def faltantes_para_autorizar(contenido, modo_captura, consentimiento):
    """P-04 provisional; mismas rutas que calcularFaltantes del frontend."""
    faltantes = []
    motivo = contenido["motivo_padecimiento"]
    for campo in ("motivo_consulta", "padecimiento_actual"):
        if not con_valor(motivo[campo]):
            faltantes.append(f"motivo_padecimiento.{campo}")
    # El esquema ya exige descripción y condición en cada diagnóstico.
    if not contenido["valoracion"]["diagnosticos"]:
        faltantes.append("valoracion.diagnosticos")
    plan = contenido["plan"]
    if not plan["medicamentos"] and not con_valor(plan["medidas_seguimiento"]):
        faltantes.append("plan.medicamentos")
    if modo_captura == "consulta" and not consentimiento:
        faltantes.append("consentimiento_grabacion")
    return faltantes


def validar_para_autorizar(datos):
    if datos["plantilla"] != PLANTILLA:
        raise ValidationError({"plantilla": "Solo se admite el formato clínico 1.1."})
    if datos["fecha_consulta"] > timezone.localdate():
        raise ValidationError(
            {"fecha_consulta": "La fecha de la consulta no puede ser futura."}
        )
    errores = validar_contenido(datos["contenido"])
    if errores:
        raise ValidationError({"contenido": errores[:20]})
    faltantes = faltantes_para_autorizar(
        datos["contenido"], datos["modo_captura"], datos["consentimiento_grabacion"]
    )
    if faltantes:
        raise ValidationError({ruta: OBLIGATORIO for ruta in faltantes})


@transaction.atomic
def autorizar_nota(*, medico, paciente, datos):
    """Crea la nota y su versión 1 juntas; el autor siempre es el médico de la sesión."""
    plantilla, _ = Plantilla.objects.get_or_create(
        **PLANTILLA, defaults={"esquema": cargar()}
    )
    if not plantilla.activa:
        raise ValidationError({"plantilla": "La plantilla no está activa."})
    nota = Nota.objects.create(
        paciente=paciente,
        medico=medico,
        plantilla=plantilla,
        fecha_consulta=datos["fecha_consulta"],
        hora_atencion=datos["hora_atencion"],
        tipo_consulta=datos["tipo_consulta"],
        modo_captura=datos["modo_captura"],
        consentimiento_grabacion=datos["consentimiento_grabacion"],
        estado="autorizada",
        version_vigente=1,
    )
    VersionNota.objects.create(
        nota=nota,
        numero=1,
        contenido=datos["contenido"],
        # P-06: se conserva el texto de la transcripción, nunca el audio.
        transcripcion=datos.get("transcripcion"),
        autorizada_por=medico,
        autorizada_en=timezone.now(),
    )
    return nota
