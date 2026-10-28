from datetime import datetime

from django.db.models import Count, Max, Q, Value
from django.db.models.functions import Concat
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.response import Response

from pacientes.models import Paciente
from pacientes.serializers import PacienteEntradaSerializer, PacienteSerializer


def pacientes_queryset():
    return Paciente.objects.annotate(
        total_notas=Count("notas"), ultima_consulta=Max("notas__fecha_consulta")
    ).order_by("id")


class PacientesView(ListCreateAPIView):
    def get_queryset(self):
        queryset = pacientes_queryset()
        query = self.request.query_params.get("q", "").strip()
        if not query:
            return queryset
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try:
                birth = datetime.strptime(query, fmt).date()
            except ValueError:
                continue
            return queryset.filter(fecha_nacimiento=birth)
        return queryset.annotate(
            nombre_busqueda=Concat(
                "nombres",
                Value(" "),
                "apellido_paterno",
                Value(" "),
                "apellido_materno",
            )
        ).filter(
            Q(nombre_busqueda__unaccent__icontains=query)
            | Q(numero_expediente__icontains=query)
        )

    def get_serializer_class(self):
        return (
            PacienteEntradaSerializer
            if self.request.method == "POST"
            else PacienteSerializer
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        result = pacientes_queryset().get(pk=obj.pk)
        return Response(PacienteSerializer(result).data, status=201)


class PacienteDetailView(RetrieveUpdateAPIView):
    http_method_names = ["get", "patch", "head", "options"]
    queryset = pacientes_queryset()

    def get_serializer_class(self):
        return (
            PacienteEntradaSerializer
            if self.request.method == "PATCH"
            else PacienteSerializer
        )

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = PacienteEntradaSerializer(
            obj, data=request.data, partial=True, context=self.get_serializer_context()
        )
        if not request.data:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"campos": "Envía al menos un campo para actualizar."}
            )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(PacienteSerializer(pacientes_queryset().get(pk=obj.pk)).data)
