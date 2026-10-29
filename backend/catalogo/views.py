from rest_framework.response import Response
from rest_framework.views import APIView

from catalogo.importacion import normalizar
from catalogo.models import LoteCatalogo
from cuentas.permissions import EsMedico


class BuscarMedicamentos(APIView):
    permission_classes = [EsMedico]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) > 100:
            return Response(
                {
                    "error": {
                        "codigo": "busqueda_invalida",
                        "mensaje": "Usa hasta 100 caracteres.",
                    }
                },
                status=400,
            )
        lote = LoteCatalogo.objects.filter(activo=True).first()
        resultados = []
        if lote and len(q) >= 2:
            entradas = lote.entradas.filter(busqueda__contains=normalizar(q)).order_by(
                "nombre", "clave", "pk"
            )[:20]
            resultados = list(entradas.values("id", "clave", "nombre", "presentacion"))
        response = Response(
            {
                "catalogo": None
                if not lote
                else {
                    "id": str(lote.pk),
                    "fuente": lote.fuente,
                    "documento": lote.documento,
                    "extraido_en": lote.extraido_en.isoformat(),
                },
                "resultados": resultados,
            }
        )
        response["Cache-Control"] = "no-store"
        return response
