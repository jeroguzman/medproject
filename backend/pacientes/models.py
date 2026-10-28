from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


def nacimiento_no_futuro(value):
    if value > timezone.localdate():
        raise ValidationError("La fecha de nacimiento no puede ser futura.")


class Paciente(models.Model):
    numero_expediente = models.CharField(
        max_length=9, unique=True, validators=[RegexValidator(r"^\d{4}-\d{4}$")]
    )
    nombres = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True)
    fecha_nacimiento = models.DateField(validators=[nacimiento_no_futuro])
    sexo = models.CharField(
        max_length=20,
        choices=[
            ("mujer", "Mujer"),
            ("hombre", "Hombre"),
            ("no_especificado", "No especificado"),
        ],
    )
    alergias = models.TextField()
    tipo_sangre = models.CharField(max_length=3, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    memoria_ref = models.CharField(max_length=100, blank=True)
    creado_por = models.ForeignKey("cuentas.Medico", on_delete=models.PROTECT)
    creado_en = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk:
            original = type(self).objects.only("numero_expediente").get(pk=self.pk)
            if self.numero_expediente != original.numero_expediente:
                raise ValidationError("El expediente no se puede cambiar.")
        super().save(*args, **kwargs)
