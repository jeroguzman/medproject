from django.db import DataError, connection, transaction
from rest_framework.exceptions import ValidationError

from pacientes.models import Paciente


@transaction.atomic
def siguiente_expediente():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(48300)")
            cursor.execute("SELECT nextval('pacientes_expediente_seq')")
            number = cursor.fetchone()[0]
    except DataError as exc:
        if getattr(exc.__cause__, "sqlstate", None) == "2200H":
            raise ValidationError(
                {"numero_expediente": "Se agotó el rango de expedientes."}
            ) from exc
        raise
    if number > 99999999:
        raise ValidationError(
            {"numero_expediente": "Se agotó el rango de expedientes."}
        )
    return f"{number // 10000:04d}-{number % 10000:04d}"


@transaction.atomic
def crear_paciente(*, medico, **values):
    return Paciente.objects.create(
        numero_expediente=siguiente_expediente(), creado_por=medico, **values
    )


def avanzar_secuencia():
    # Serialize sequence adjustment with other administrative fixture imports.
    # Only run before serving traffic, not as part of individual registrations.
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(48300)")
            cursor.execute("SELECT last_value, is_called FROM pacientes_expediente_seq")
            last, used = cursor.fetchone()
            cursor.execute(
                "SELECT MAX(REPLACE(numero_expediente, '-', '')::bigint) FROM pacientes_paciente"
            )
            maximum = cursor.fetchone()[0] or 48299
            next_value = max(48300, last + int(used), maximum + 1)
            # Never rewind an already allocated value; gaps are intentional.
            cursor.execute(
                "SELECT setval('pacientes_expediente_seq', %s, false)", [next_value]
            )
