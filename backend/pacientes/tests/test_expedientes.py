from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from cuentas.models import Medico
from django.db import IntegrityError, close_old_connections, connection, transaction
from django.test import TransactionTestCase
from rest_framework.exceptions import ValidationError
from tests.helpers import medico, patient

from pacientes.models import Paciente
from pacientes.services import avanzar_secuencia, crear_paciente, siguiente_expediente


class ExpedienteTests(TransactionTestCase):
    def setUp(self):
        self.user, self.profile = medico()
        with connection.cursor() as cursor:
            cursor.execute("SELECT setval('pacientes_expediente_seq',48300,false)")

    def test_concurrent_creation_has_unique_numbers(self):
        barrier = Barrier(2)

        def create(index):
            close_old_connections()
            try:
                profile = Medico.objects.get(pk=self.profile.pk)
                barrier.wait(timeout=10)
                obj = crear_paciente(
                    medico=profile,
                    nombres=f"Prueba{index}",
                    apellido_paterno="Ficticio",
                    fecha_nacimiento="2000-01-01",
                    sexo="no_especificado",
                    alergias="Sin alergias conocidas",
                )
                return obj.numero_expediente
            finally:
                connection.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            numbers = list(pool.map(create, range(2)))
        self.assertEqual(set(numbers), {"0004-8300", "0004-8301"})
        self.assertEqual(Paciente.objects.count(), 2)

    def test_import_adjustment_does_not_rewind(self):
        patient(self.profile, numero="0005-0000")
        avanzar_secuencia()
        avanzar_secuencia()
        self.assertEqual(siguiente_expediente(), "0005-0001")
        avanzar_secuencia()
        self.assertEqual(siguiente_expediente(), "0005-0002")

    def test_unique_constraint(self):
        patient(self.profile)
        with self.assertRaises(IntegrityError), transaction.atomic():
            patient(self.profile)

    def test_range_exhaustion_is_validation_error(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT setval('pacientes_expediente_seq',99999999,true)")
        with self.assertRaises(ValidationError):
            siguiente_expediente()
