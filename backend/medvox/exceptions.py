from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "error": {
                    "codigo": "error_interno",
                    "mensaje": "No se pudo completar la operación.",
                }
            },
            status=500,
        )
    if isinstance(exc, ValidationError):
        error = {
            "codigo": "validacion",
            "mensaje": "Revisa los datos enviados.",
            "detalles": response.data,
        }
        if isinstance(response.data, dict):
            error["faltantes"] = list(response.data)
    elif isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        error = {
            "codigo": "no_autenticado",
            "mensaje": "Inicia sesión con credenciales válidas.",
        }
    elif isinstance(exc, PermissionDenied):
        error = {
            "codigo": "sin_permiso",
            "mensaje": "Necesitas un perfil médico activo.",
        }
    elif response.status_code == 404:
        error = {"codigo": "no_encontrado", "mensaje": "El recurso no existe."}
    elif response.status_code == 405:
        error = {
            "codigo": "metodo_no_permitido",
            "mensaje": "Esta operación no está disponible.",
        }
    elif response.status_code == 429:
        error = {
            "codigo": "demasiados_intentos",
            "mensaje": "Espera un momento antes de volver a intentar.",
        }
    else:
        error = {
            "codigo": "peticion_invalida",
            "mensaje": "No se pudo procesar la petición.",
        }
    response.data = {"error": error}
    return response


def not_found(request, exception=None):
    from django.http import JsonResponse

    return JsonResponse(
        {"error": {"codigo": "no_encontrado", "mensaje": "El recurso no existe."}},
        status=404,
    )
