from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from pacientes.models import Paciente
from rest_framework.generics import ListAPIView, RetrieveAPIView

from notas.models import Nota, VersionNota
from notas.serializers import NotaDetalleSerializer, NotaResumenSerializer


def notas_queryset():
    return (
        Nota.objects.select_related("medico", "plantilla")
        .prefetch_related(
            Prefetch(
                "versiones",
                queryset=VersionNota.objects.select_related("autorizada_por").order_by(
                    "-numero"
                ),
            )
        )
        .order_by("-fecha_consulta", "-hora_atencion", "-id")
    )


class HistorialView(ListAPIView):
    serializer_class = NotaResumenSerializer

    def get_queryset(self):
        get_object_or_404(Paciente, pk=self.kwargs["pk"])
        return notas_queryset().filter(paciente_id=self.kwargs["pk"])


class NotaDetailView(RetrieveAPIView):
    serializer_class = NotaDetalleSerializer
    queryset = notas_queryset()
