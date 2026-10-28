import os

from django.contrib.auth import get_user_model
from django.core.management.base import CommandError
from django.db import transaction

from cuentas.models import Medico

MEDICOS = [
    ("pmendez", "Dra. Paula Méndez Ortiz", "12345678"),
    ("esalas", "Dr. Ernesto Salas Ibarra", "87654321"),
]


@transaction.atomic
def cargar_medicos():
    User = get_user_model()
    password = os.environ.get("DEMO_PASSWORD")
    if not password and User.objects.filter(
        username__in=[m[0] for m in MEDICOS]
    ).count() != len(MEDICOS):
        raise CommandError("Configura DEMO_PASSWORD para crear los médicos ficticios.")
    result = []
    for username, nombre, cedula in MEDICOS:
        user = User.objects.filter(username=username).first()
        if user is None:
            user = User.objects.create_user(username=username, password=password)
        medico, _ = Medico.objects.get_or_create(
            usuario=user,
            defaults={
                "nombre_completo": nombre,
                "cedula_profesional": cedula,
                "especialidad": "Medicina general",
            },
        )
        result.append(medico)
    return result
