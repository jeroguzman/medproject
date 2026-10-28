from django.conf import settings
from django.db import models


class Medico(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="medico"
    )
    nombre_completo = models.CharField(max_length=200)
    cedula_profesional = models.CharField(max_length=20)
    especialidad = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre_completo
