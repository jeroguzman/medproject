from django.utils import timezone
from rest_framework import serializers
from vozclinica.serializers import StrictSerializerMixin

from pacientes.models import Paciente
from pacientes.services import crear_paciente


class PacienteSerializer(serializers.ModelSerializer):
    ultima_consulta = serializers.DateField(read_only=True, allow_null=True)
    total_notas = serializers.IntegerField(read_only=True)
    telefono = serializers.SerializerMethodField()

    def get_telefono(self, obj):
        return obj.telefono or None

    class Meta:
        model = Paciente
        fields = (
            "id",
            "numero_expediente",
            "nombres",
            "apellido_paterno",
            "apellido_materno",
            "fecha_nacimiento",
            "sexo",
            "alergias",
            "tipo_sangre",
            "telefono",
            "ultima_consulta",
            "total_notas",
        )


class PacienteEntradaSerializer(StrictSerializerMixin, serializers.ModelSerializer):
    telefono = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=20
    )

    class Meta:
        model = Paciente
        fields = (
            "nombres",
            "apellido_paterno",
            "apellido_materno",
            "fecha_nacimiento",
            "sexo",
            "alergias",
            "telefono",
        )

    def validate_fecha_nacimiento(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError(
                "La fecha de nacimiento no puede ser futura."
            )
        return value

    def validate_telefono(self, value):
        return value or ""

    def create(self, validated_data):
        return crear_paciente(
            medico=self.context["request"].user.medico, **validated_data
        )
