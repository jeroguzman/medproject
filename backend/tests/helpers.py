from django.contrib.auth import get_user_model

from cuentas.models import Medico


def medico(username="doctor"):
    user = get_user_model().objects.create_user(
        username=username, password="clave-ficticia-tests-2026"
    )
    profile = Medico.objects.create(
        usuario=user,
        nombre_completo="Dra. Prueba",
        cedula_profesional="12345678",
        especialidad="General",
    )
    return user, profile


def patient(profile, numero="0004-8217", **kwargs):
    from pacientes.models import Paciente

    values = {
        "numero_expediente": numero,
        "nombres": "María Fernanda",
        "apellido_paterno": "García",
        "apellido_materno": "López",
        "fecha_nacimiento": "1992-03-12",
        "sexo": "mujer",
        "alergias": "Penicilina",
        "creado_por": profile,
    }
    values.update(kwargs)
    return Paciente.objects.create(**values)


def note(profile, patient, **kwargs):
    from django.utils import timezone

    from notas.models import Nota, Plantilla, VersionNota

    template, _ = Plantilla.objects.get_or_create(
        clave="formato_clinico_general", version="1.1", defaults={"esquema": {}}
    )
    values = {
        "paciente": patient,
        "medico": profile,
        "plantilla": template,
        "fecha_consulta": "2026-08-14",
        "hora_atencion": "10:30",
        "tipo_consulta": "primera_vez",
        "modo_captura": "dictado",
    }
    values.update(kwargs)
    n = Nota.objects.create(**values)
    # Isolated synthetic read fixture, not a substitute for the full clinical schema.
    VersionNota.objects.create(
        nota=n,
        numero=1,
        contenido={
            "valoracion": {"diagnosticos": [{"descripcion": "Prueba ficticia"}]}
        },
        autorizada_por=profile,
        autorizada_en=timezone.now(),
    )
    return n
