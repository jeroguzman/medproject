from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from notas.models import Nota, VersionNota
from notas.serializers import (
    NotaDetalleSerializer,
    NotaEntradaSerializer,
    NotaResumenSerializer,
)
from notas.services import autorizar_nota, validar_para_autorizar
from pacientes.models import Paciente


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


class NotasView(APIView):
    """POST /api/notas: el médico autoriza el borrador y nace la versión 1."""

    def post(self, request):
        entrada = NotaEntradaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        datos = entrada.validated_data
        paciente = get_object_or_404(Paciente, pk=datos["paciente_id"])
        validar_para_autorizar(datos)
        nota = autorizar_nota(
            medico=request.user.medico, paciente=paciente, datos=datos
        )
        return Response(
            NotaDetalleSerializer(notas_queryset().get(pk=nota.pk)).data, status=201
        )
