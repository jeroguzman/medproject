from cuentas.demo import cargar_medicos
from django.core.management.base import BaseCommand
from django.db import transaction
from pacientes.demo import cargar_pacientes


class Command(BaseCommand):
    help = "Carga médicos y pacientes ficticios sin sobrescribir datos existentes."

    def add_arguments(self, parser):
        parser.add_argument("--solo-medicos", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        medicos = cargar_medicos()
        self.stdout.write(
            self.style.SUCCESS(
                f"Médicos ficticios disponibles: {len(medicos)}. Sin contraseñas en la salida."
            )
        )
        if not options["solo_medicos"]:
            total = cargar_pacientes(medicos[0])
            self.stdout.write(
                self.style.SUCCESS(f"Pacientes de demo disponibles: {total}.")
            )
            self.stdout.write(
                self.style.WARNING(
                    "No se cargaron notas: T028 espera el esquema y ejemplos completos de Luis (T027 / VC-01)."
                )
            )
