"""Administrative extraction only: no patient data and no automatic publication."""

import hashlib
import json
import unicodedata
from urllib.parse import urlsplit

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from catalogo.models import LoteCatalogo, MedicamentoCatalogo

FUENTE = "https://www.imss.gob.mx/profesionales-salud/cuadros-basicos/medicamentos"
ESQUEMA = {
    "type": "object",
    "properties": {
        "documento": {"type": "string"},
        "medicamentos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    k: {"type": "string"} for k in ("clave", "nombre", "presentacion")
                },
                "required": ["clave", "nombre", "presentacion"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["documento", "medicamentos"],
    "additionalProperties": False,
}


class ErrorCatalogo(Exception):
    pass


def normalizar(texto):
    return "".join(
        c
        for c in unicodedata.normalize("NFKD", texto.casefold())
        if not unicodedata.combining(c)
    )


def fuente_imss(url):
    if not isinstance(url, str) or len(url) > 2048:
        raise ErrorCatalogo("Fuente inválida.")
    try:
        p = urlsplit(url)
        valido = (
            p.scheme == "https"
            and p.hostname
            and (p.hostname == "imss.gob.mx" or p.hostname.endswith(".imss.gob.mx"))
            and not p.username
            and not p.password
            and p.port in (None, 443)
            and not p.fragment
        )
    except ValueError:
        valido = False
    if not valido:
        raise ErrorCatalogo("Solo se aceptan fuentes HTTPS del IMSS.")
    return url


def huella(data):
    return hashlib.sha256(
        json.dumps(data, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def extraer(url):
    fuente_imss(url)
    if not settings.FIRECRAWL_API_KEY:
        raise ErrorCatalogo("Falta FIRECRAWL_API_KEY en el contenedor.")
    try:
        r = requests.post(
            "https://api.firecrawl.dev/v2/scrape",
            headers={"Authorization": "Bearer " + settings.FIRECRAWL_API_KEY},
            json={
                "url": url,
                "formats": [
                    "markdown",
                    "links",
                    {
                        "type": "json",
                        "schema": ESQUEMA,
                        "prompt": (
                            "Extrae solo medicamentos explícitamente presentes en este documento del IMSS. "
                            "Copia literalmente nombre genérico, clave institucional y presentación asociada. "
                            "No inventes ni infieras dosis, equivalencias, registros o vigencia. "
                            "Usa cadena vacía para clave/presentación ausentes y lista vacía si es un índice. "
                            "No unas columnas de medicamentos distintos. documento es el título y fecha "
                            "solo si están publicados. No afirmes que el listado es completo."
                        ),
                    },
                ],
            },
            timeout=(10, 180),
            allow_redirects=False,
        )
        if r.status_code != 200:
            raise ErrorCatalogo(
                f"Firecrawl rechazó la extracción (HTTP {r.status_code}); no se cambió el catálogo."
            )
        payload = r.json()
        if not isinstance(payload, dict) or payload.get("success") is not True:
            raise ErrorCatalogo("Firecrawl no confirmó una extracción válida.")
        data = payload.get("data")
        if not isinstance(data, dict) or not isinstance(data.get("json"), dict):
            raise ErrorCatalogo(
                "Firecrawl no devolvió datos estructurados; revisar formato del documento."
            )
        result = {
            "version": 1,
            "fuente": url,
            "extraido_en": timezone.now().isoformat(),
            "documento": data["json"].get("documento", ""),
            "medicamentos": data["json"].get("medicamentos", []),
            "enlaces": data.get("links", []),
            "texto_fuente": data.get("markdown", ""),
        }
        validar(result, permitir_vacio=True)
        return result
    except (requests.RequestException, ValueError) as exc:
        raise ErrorCatalogo(
            "No se pudo completar la extracción; no se cambió el catálogo."
        ) from exc


def validar(data, permitir_vacio=False):
    if not isinstance(data, dict) or data.get("version") != 1:
        raise ErrorCatalogo("Formato de lote inválido.")
    fuente_imss(data.get("fuente"))
    fecha = data.get("extraido_en")
    try:
        fecha = parse_datetime(fecha) if isinstance(fecha, str) else None
    except ValueError:
        fecha = None
    if not fecha or timezone.is_naive(fecha) or fecha > timezone.now():
        raise ErrorCatalogo(
            "La fecha de extracción debe ser válida, con zona horaria y no futura."
        )
    if (
        not isinstance(data.get("documento"), str)
        or not (0 if permitir_vacio else 1) <= len(data["documento"].strip()) <= 500
    ):
        raise ErrorCatalogo(
            "Indica título/versión del documento comprobado (máximo 500 caracteres)."
        )
    rows = data.get("medicamentos")
    if (
        not isinstance(rows, list)
        or len(rows) > 50000
        or (not rows and not permitir_vacio)
    ):
        raise ErrorCatalogo("El lote debe contener entre 1 y 50000 medicamentos.")
    clean = []
    seen = set()
    for row in rows:
        if not isinstance(row, dict) or set(row) != {"clave", "nombre", "presentacion"}:
            raise ErrorCatalogo("Campos de medicamento inválidos.")
        if any(not isinstance(v, str) for v in row.values()):
            raise ErrorCatalogo("Los campos deben ser texto.")
        row = {k: v.strip() for k, v in row.items()}
        if (
            not row["nombre"]
            or len(row["nombre"]) > 500
            or len(row["clave"]) > 100
            or len(row["presentacion"]) > 4000
        ):
            raise ErrorCatalogo("Nombre obligatorio o longitud de campo inválida.")
        key = huella(row)
        if key not in seen:
            clean.append((row, key))
            seen.add(key)
    return fecha, clean


@transaction.atomic
def importar(data):
    fecha, rows = validar(data)
    digest = huella(
        {
            "fuente": data["fuente"],
            "documento": data["documento"],
            "medicamentos": sorted([row for row, _ in rows], key=huella),
        }
    )
    lote, created = LoteCatalogo.objects.get_or_create(
        huella=digest,
        defaults={
            "fuente": data["fuente"],
            "documento": data["documento"],
            "extraido_en": fecha,
        },
    )
    if created:
        MedicamentoCatalogo.objects.bulk_create(
            [
                MedicamentoCatalogo(
                    lote=lote,
                    **row,
                    huella=key,
                    busqueda=normalizar(" ".join(row.values())),
                )
                for row, key in rows
            ]
        )
    return lote


@transaction.atomic
def publicar(lote_id):
    # Serialize publications even when no previous snapshot exists.
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_advisory_xact_lock(48302)")
    lote = LoteCatalogo.objects.get(pk=lote_id)
    if not lote.entradas.exists():
        raise ErrorCatalogo("No se puede publicar un lote vacío.")
    LoteCatalogo.objects.filter(activo=True).update(activo=False)
    lote.activo = True
    lote.publicado_en = timezone.now()
    lote.save(update_fields=["activo", "publicado_en"])
    return lote
