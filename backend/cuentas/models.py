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


class MojoAuthChallenge(models.Model):
    """One-use authentication state. OTP and provider tokens are never persisted."""

    digest = models.CharField(max_length=64, unique=True)
    email_digest = models.CharField(max_length=64)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    provider_state = models.CharField(max_length=500)
    expires_at = models.DateTimeField(db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)
