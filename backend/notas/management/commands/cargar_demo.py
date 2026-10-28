from django.core.management.base import BaseCommand
from django.db import connection, transaction

from cuentas.demo import cargar_medicos
from notas.demo import cargar_notas, comprobar_plantilla, preparar_notas
from pacientes.demo import cargar_pacientes


class Command(BaseCommand):
    help = (
        "Carga médicos, pacientes y notas ficticias sin sobrescribir datos existentes."
    )

    def add_arguments(self, parser):
        parser.add_argument("--solo-medicos", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        # Serialize administrative imports; all fixture validation precedes writes.
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(48301)")
        if not options["solo_medicos"]:
            schema, records = preparar_notas()
            comprobar_plantilla(schema)
        medicos = cargar_medicos()
        patients = notes = 0
        if not options["solo_medicos"]:
            patients = cargar_pacientes(medicos[0])
            notes = cargar_notas(schema, records, medicos)
        self.stdout.write(
            self.style.SUCCESS(
                f"Médicos ficticios disponibles: {len(medicos)}. Sin contraseñas en la salida."
            )
        )
        if not options["solo_medicos"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Pacientes de demo disponibles: {patients}. Notas ficticias nuevas: {notes}."
                )
            )
