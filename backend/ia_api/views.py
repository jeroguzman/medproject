from pathlib import PurePath

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import serializers
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from ia_api import servicio
from medvox.serializers import StrictSerializerMixin
from pacientes.models import Paciente

EXTENSIONES_AUDIO = {".mp3", ".m4a", ".wav", ".webm", ".ogg", ".oga", ".mp4", ".aac"}


class ProcesarEntradaSerializer(StrictSerializerMixin, serializers.Serializer):
    audio = serializers.FileField()
    paciente_id = serializers.IntegerField(min_value=1)
    modo = serializers.ChoiceField(choices=["dictado", "consulta"])


@method_decorator(never_cache, name="dispatch")
class ProcesarView(APIView):
    """POST /api/ia/procesar: audio → transcripción, borrador y alertas, sin guardar."""

    parser_classes = [MultiPartParser]
    throttle_scope = "ia_procesar"

    def post(self, request):
        # Se rechaza antes de leer el cuerpo: lo aceptado cabe en memoria (D-02).
        try:
            longitud = int(request.META.get("CONTENT_LENGTH") or 0)
        except ValueError:
            longitud = 0
        if longitud > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            return audio_muy_grande()
        audio = request.data.get("audio")
        if not isinstance(audio, UploadedFile) or not audio.size:
            return error(
                400, "audio_invalido", "No llegó ningún audio. Graba o sube un archivo."
            )
        if audio.size > settings.IA_AUDIO_MAX_BYTES:
            return audio_muy_grande()
        tipo = (audio.content_type or "").split(";")[0].strip().lower()
        extension = PurePath(audio.name or "").suffix.lower()
        if not tipo.startswith(("audio/", "video/")) and extension not in (
            EXTENSIONES_AUDIO
        ):
            return error(
                400,
                "audio_invalido",
                "Ese archivo no es de audio. Sube un mp3, m4a, wav o webm.",
            )
        datos = ProcesarEntradaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        paciente = get_object_or_404(Paciente, pk=datos.validated_data["paciente_id"])
        try:
            resultado = servicio.procesar(
                audio=audio.read(),
                nombre=audio.name or "audio" + extension,
                tipo=tipo or "application/octet-stream",
                modo=datos.validated_data["modo"],
                paciente=paciente,
            )
        except servicio.ErrorProcesamiento as exc:
            return error(exc.status, exc.codigo, exc.mensaje)
        return Response(resultado)


def error(status, codigo, mensaje):
    return Response({"error": {"codigo": codigo, "mensaje": mensaje}}, status=status)


def audio_muy_grande():
    return error(413, "audio_muy_grande", "El audio supera 50 MB.")
