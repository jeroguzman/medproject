from rest_framework import serializers
from vozclinica.serializers import StrictSerializerMixin

from cuentas.models import Medico


class MedicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = ("id", "nombre_completo", "cedula_profesional", "especialidad")


class LoginSerializer(StrictSerializerMixin, serializers.Serializer):
    usuario = serializers.CharField(max_length=150)
    contrasena = serializers.CharField(write_only=True, trim_whitespace=False)
