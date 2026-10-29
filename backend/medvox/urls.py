from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response

from catalogo.views import BuscarMedicamentos
from medvox.exceptions import not_found
from medvox.health import readiness


@api_view(["GET"])
def salud(request):
    return Response({"ok": True})


urlpatterns = [
    path("healthz", readiness),
    path("api/catalogo/medicamentos", BuscarMedicamentos.as_view()),
    path("api/auth/", include("cuentas.urls")),
    path("api/", include("pacientes.urls")),
    path("api/", include("notas.urls")),
    path("api/ia/", include("ia_api.urls")),
    path("api/salud", salud),
]
handler404 = not_found
