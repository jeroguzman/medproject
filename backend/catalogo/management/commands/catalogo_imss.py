import json
import sys

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from catalogo.importacion import (
    FUENTE,
    ErrorCatalogo,
    extraer,
    extraer_pdfs,
    importar,
    importar_documentos,
    publicar,
)
from catalogo.models import LoteCatalogo


class Command(BaseCommand):
    help = "Extrae, importa o publica un lote IMSS; nunca publica automáticamente."

    def add_arguments(self, parser):
        sub = parser.add_subparsers(dest="accion", required=True)
        scrape = sub.add_parser("extraer")
        scrape.add_argument("--url", default=FUENTE)
        pdfs = sub.add_parser("extraer-pdfs")
        pdfs.add_argument("--url", default=FUENTE)
        pdfs.add_argument("--max-pdfs", type=int, default=20)
        load = sub.add_parser("importar")
        load.add_argument("--archivo", required=True)
        publish = sub.add_parser("publicar")
        publish.add_argument("--lote", required=True)
        publish.add_argument("--confirmar-revision", action="store_true", required=True)

    def handle(self, *args, **options):
        try:
            if options["accion"] == "extraer":
                self.stdout.write(
                    json.dumps(extraer(options["url"]), ensure_ascii=False, indent=2)
                )
            elif options["accion"] == "extraer-pdfs":
                self.stdout.write(
                    json.dumps(
                        extraer_pdfs(options["url"], options["max_pdfs"]),
                        ensure_ascii=False,
                        indent=2,
                    )
                )
            elif options["accion"] == "importar":
                if options["archivo"] == "-":
                    datos = json.load(sys.stdin)
                    lote = (
                        importar_documentos(datos)
                        if isinstance(datos, dict) and "documentos" in datos
                        else importar(datos)
                    )
                else:
                    with open(options["archivo"], encoding="utf-8") as f:
                        datos = json.load(f)
                        lote = (
                            importar_documentos(datos)
                            if isinstance(datos, dict) and "documentos" in datos
                            else importar(datos)
                        )
                self.stdout.write(
                    f"Lote pendiente: {lote.pk}; entradas: {lote.entradas.count()}"
                )
            else:
                lote = publicar(options["lote"])
                self.stdout.write(f"Lote publicado: {lote.pk}")
        except (
            ErrorCatalogo,
            OSError,
            ValueError,
            ValidationError,
            LoteCatalogo.DoesNotExist,
        ) as exc:
            # Do not echo raw provider payloads, credentials or file contents.
            if isinstance(exc, ErrorCatalogo):
                raise CommandError(str(exc)) from None
            raise CommandError(
                "No se pudo procesar el lote; verifica archivo, JSON o identificador."
            ) from None
