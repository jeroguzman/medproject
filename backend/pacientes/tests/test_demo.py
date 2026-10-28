from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from cuentas.models import Medico
from notas.models import Nota
from pacientes.models import Paciente


class DemoTests(TestCase):
    def test_repeated_load_preserves_existing_records_and_credentials(self):
        with patch.dict("os.environ", {"DEMO_PASSWORD": "clave-ficticia-tests-2026"}):
            call_command("cargar_demo", stdout=StringIO())
            paciente = Paciente.objects.get(numero_expediente="0004-8217")
            self.assertIn("Penicilina", paciente.alergias)
            paciente.alergias = "Cambio manual ficticio"
            paciente.save()
            user = get_user_model().objects.get(username="pmendez")
            hashed = user.password
            call_command("cargar_demo", stdout=StringIO())
            paciente.refresh_from_db()
            user.refresh_from_db()
            self.assertEqual(paciente.alergias, "Cambio manual ficticio")
            self.assertEqual(user.password, hashed)
            self.assertEqual(Paciente.objects.count(), 6)
            self.assertEqual(Medico.objects.count(), 2)
            self.assertEqual(Nota.objects.count(), 5)
