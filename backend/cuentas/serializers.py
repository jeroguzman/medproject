from rest_framework import serializers

from cuentas.models import Medico
from vozclinica.serializers import StrictSerializerMixin


class MedicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = ("id", "nombre_completo", "cedula_profesional", "especialidad")


class LoginSerializer(StrictSerializerMixin, serializers.Serializer):
    usuario = serializers.CharField(max_length=150)
    contrasena = serializers.CharField(write_only=True, trim_whitespace=False)


class MojoAuthStartSerializer(StrictSerializerMixin, serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class MojoAuthVerifySerializer(StrictSerializerMixin, serializers.Serializer):
    challenge_id = serializers.CharField(
        min_length=32, max_length=100, trim_whitespace=False
    )
    otp = serializers.RegexField(r"^\d{4,10}$", write_only=True, trim_whitespace=False)
