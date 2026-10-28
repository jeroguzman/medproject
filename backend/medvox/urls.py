from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response

from medvox.exceptions import not_found


@api_view(["GET"])
def salud(request):
    return Response({"ok": True})


urlpatterns = [
    path("api/auth/", include("cuentas.urls")),
    path("api/", include("pacientes.urls")),
    path("api/", include("notas.urls")),
    path("api/salud", salud),
]
handler404 = not_found
