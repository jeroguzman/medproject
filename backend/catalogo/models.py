import uuid

from django.db import models


class LoteCatalogo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    huella = models.CharField(max_length=64, unique=True)
    fuente = models.URLField(max_length=2048)
    extraido_en = models.DateTimeField()
    documento = models.CharField(max_length=500)
    activo = models.BooleanField(default=False)
    publicado_en = models.DateTimeField(null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["activo"],
                condition=models.Q(activo=True),
                name="un_catalogo_activo",
            )
        ]


class MedicamentoCatalogo(models.Model):
    lote = models.ForeignKey(
        LoteCatalogo, on_delete=models.CASCADE, related_name="entradas"
    )
    clave = models.CharField(max_length=100, blank=True)
    nombre = models.CharField(max_length=500)
    presentacion = models.TextField(blank=True)
    busqueda = models.TextField()
    huella = models.CharField(max_length=64)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["lote", "huella"], name="entrada_unica_por_lote"
            )
        ]
