from rest_framework import serializers

from cuentas.serializers import MedicoSerializer
from notas.models import Nota, Plantilla, VersionNota
from pacientes.serializers import PacienteSerializer
from pacientes.views import pacientes_queryset
from vozclinica.serializers import StrictSerializerMixin

CAMPOS_SEGMENTO = {"hablante", "rol", "texto", "inicio", "fin", "audio"}


class NotaResumenSerializer(serializers.ModelSerializer):
    hora_atencion = serializers.TimeField(format="%H:%M")
    medico = serializers.CharField(source="medico.nombre_completo")
    diagnostico_principal = serializers.SerializerMethodField()

    def get_diagnostico_principal(self, obj):
        version = next(
            (v for v in obj.versiones.all() if v.numero == obj.version_vigente), None
        )
        if version is None:
            return None
        diagnoses = version.contenido.get("valoracion", {}).get("diagnosticos", [])
        return diagnoses[0].get("descripcion") if diagnoses else None

    class Meta:
        model = Nota
        fields = (
            "id",
            "fecha_consulta",
            "hora_atencion",
            "tipo_consulta",
            "diagnostico_principal",
            "estado",
            "version_vigente",
            "medico",
        )


class PlantillaRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plantilla
        fields = ("clave", "version")


class VersionNotaSerializer(serializers.ModelSerializer):
    autorizada_por = serializers.CharField(source="autorizada_por.nombre_completo")
    motivo_cambio = serializers.SerializerMethodField()

    def get_motivo_cambio(self, obj):
        return obj.motivo_cambio or None

    class Meta:
        model = VersionNota
        fields = (
            "numero",
            "contenido",
            "transcripcion",
            "autorizada_por",
            "autorizada_en",
            "motivo_cambio",
        )


class NotaDetalleSerializer(serializers.ModelSerializer):
    paciente = serializers.SerializerMethodField()
    medico = MedicoSerializer(read_only=True)
    plantilla = PlantillaRefSerializer(read_only=True)
    hora_atencion = serializers.TimeField(format="%H:%M")
    versiones = VersionNotaSerializer(many=True, read_only=True)

    def get_paciente(self, obj):
        return PacienteSerializer(pacientes_queryset().get(pk=obj.paciente_id)).data

    class Meta:
        model = Nota
        fields = (
            "id",
            "paciente",
            "medico",
            "plantilla",
            "fecha_consulta",
            "hora_atencion",
            "tipo_consulta",
            "modo_captura",
            "consentimiento_grabacion",
            "estado",
            "version_vigente",
            "versiones",
        )


class PlantillaEntradaSerializer(StrictSerializerMixin, serializers.Serializer):
    clave = serializers.CharField(max_length=50)
    version = serializers.CharField(max_length=10)


class NotaEntradaSerializer(StrictSerializerMixin, serializers.Serializer):
    paciente_id = serializers.IntegerField(min_value=1)
    plantilla = PlantillaEntradaSerializer()
    fecha_consulta = serializers.DateField()
    hora_atencion = serializers.TimeField()
    tipo_consulta = serializers.ChoiceField(choices=["primera_vez", "seguimiento"])
    modo_captura = serializers.ChoiceField(choices=["dictado", "consulta"])
    consentimiento_grabacion = serializers.BooleanField()
    # Se valida contra el esquema compartido en notas.services.
    contenido = serializers.JSONField()
    transcripcion = serializers.JSONField(required=False, allow_null=True)

    def validate_transcripcion(self, value):
        if value is None:
            return None
        invalida = serializers.ValidationError(
            "La transcripción no tiene el formato esperado."
        )
        if not isinstance(value, dict):
            raise invalida
        texto, segmentos = value.get("texto"), value.get("segmentos")
        if not isinstance(texto, str) or not isinstance(segmentos, list):
            raise invalida
        if not all(
            isinstance(s, dict) and isinstance(s.get("texto"), str) for s in segmentos
        ):
            raise invalida
        if not texto.strip() and not segmentos:
            return None  # Nota capturada a mano, sin audio procesado.
        return {
            "texto": texto,
            "segmentos": [
                {k: v for k, v in s.items() if k in CAMPOS_SEGMENTO} for s in segmentos
            ],
        }
