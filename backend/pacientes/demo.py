from django.db import transaction

from pacientes.models import Paciente
from pacientes.services import avanzar_secuencia

PACIENTES = [
    (
        "0004-8217",
        "María Fernanda",
        "García",
        "López",
        "1992-03-12",
        "mujer",
        "Penicilina (urticaria generalizada)",
        "O+",
    ),
    (
        "0004-8150",
        "Jorge",
        "Ramírez",
        "Soto",
        "1968-05-20",
        "hombre",
        "Sin alergias conocidas",
        "A+",
    ),
    (
        "0004-8011",
        "Rosa Elena",
        "Castillo",
        "Vega",
        "1960-06-02",
        "mujer",
        "Sulfas (exantema)",
        "B+",
    ),
    (
        "0004-8233",
        "Luis Alberto",
        "Torres",
        "Medina",
        "1985-01-15",
        "hombre",
        "Sin alergias conocidas",
        "O+",
    ),
    (
        "0004-8102",
        "Ana Sofía",
        "Hernández",
        "Ruiz",
        "2019-05-03",
        "mujer",
        "Sin alergias conocidas",
        "",
    ),
    (
        "0004-8299",
        "Juan Carlos",
        "Pérez",
        "Gómez",
        "1979-11-30",
        "hombre",
        "Sin alergias conocidas",
        "",
    ),
]


@transaction.atomic
def cargar_pacientes(medico):
    for (
        numero,
        nombres,
        paterno,
        materno,
        nacimiento,
        sexo,
        alergias,
        sangre,
    ) in PACIENTES:
        Paciente.objects.get_or_create(
            numero_expediente=numero,
            defaults={
                "nombres": nombres,
                "apellido_paterno": paterno,
                "apellido_materno": materno,
                "fecha_nacimiento": nacimiento,
                "sexo": sexo,
                "alergias": alergias,
                "tipo_sangre": sangre,
                "creado_por": medico,
            },
        )
    avanzar_secuencia()
    return len(PACIENTES)
