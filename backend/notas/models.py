from django.core.exceptions import ValidationError
from django.db import models


class Plantilla(models.Model):
    clave = models.CharField(max_length=50)
    version = models.CharField(max_length=10)
    esquema = models.JSONField()
    activa = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["clave", "version"], name="plantilla_clave_version_unica"
            )
        ]


class Nota(models.Model):
    paciente = models.ForeignKey(
        "pacientes.Paciente", on_delete=models.PROTECT, related_name="notas"
    )
    medico = models.ForeignKey("cuentas.Medico", on_delete=models.PROTECT)
    plantilla = models.ForeignKey(Plantilla, on_delete=models.PROTECT)
    fecha_consulta = models.DateField()
    hora_atencion = models.TimeField()
    tipo_consulta = models.CharField(
        max_length=20,
        choices=[("primera_vez", "Primera vez"), ("seguimiento", "Seguimiento")],
    )
    modo_captura = models.CharField(
        max_length=10, choices=[("dictado", "Dictado"), ("consulta", "Consulta")]
    )
    consentimiento_grabacion = models.BooleanField(default=False)
    estado = models.CharField(
        max_length=12,
        default="autorizada",
        choices=[("autorizada", "Autorizada"), ("corregida", "Corregida")],
    )
    version_vigente = models.PositiveIntegerField(default=1)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(version_vigente__gte=1), name="nota_version_positiva"
            ),
            models.CheckConstraint(
                condition=models.Q(modo_captura="dictado")
                | models.Q(consentimiento_grabacion=True),
                name="consulta_con_consentimiento",
            ),
            models.CheckConstraint(
                condition=models.Q(estado__in=["autorizada", "corregida"]),
                name="nota_solo_autorizada_corregida",
            ),
        ]


class VersionQuerySet(models.QuerySet):
    def update(self, **kwargs):
        raise ValidationError("Las versiones no se modifican.")

    def delete(self):
        raise ValidationError("Las versiones no se borran.")

    def bulk_update(self, *args, **kwargs):
        raise ValidationError("Las versiones no se modifican.")


class VersionNota(models.Model):
    nota = models.ForeignKey(Nota, on_delete=models.PROTECT, related_name="versiones")
    numero = models.PositiveIntegerField()
    contenido = models.JSONField()
    transcripcion = models.JSONField(null=True, blank=True)
    autorizada_por = models.ForeignKey("cuentas.Medico", on_delete=models.PROTECT)
    autorizada_en = models.DateTimeField()
    motivo_cambio = models.TextField(blank=True)
    objects = VersionQuerySet.as_manager()

    class Meta:
        ordering = ["-numero"]
        constraints = [
            models.UniqueConstraint(
                fields=["nota", "numero"], name="nota_numero_version_unicos"
            ),
            models.CheckConstraint(
                condition=models.Q(numero__gte=1), name="version_numero_positivo"
            ),
            models.CheckConstraint(
                condition=models.Q(numero=1) | ~models.Q(motivo_cambio=""),
                name="correccion_con_motivo",
            ),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding or (
            self.pk is not None and type(self).objects.filter(pk=self.pk).exists()
        ):
            raise ValidationError("Las versiones no se modifican.")
        if self.numero >= 2 and not self.motivo_cambio.strip():
            raise ValidationError("La corrección requiere motivo.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Las versiones no se borran.")
