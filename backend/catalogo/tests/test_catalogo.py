import json
from copy import deepcopy
from io import StringIO
from unittest.mock import Mock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from catalogo.importacion import FUENTE, ErrorCatalogo, extraer, importar, publicar
from catalogo.models import LoteCatalogo
from tests.helpers import medico


def ejemplo():
    # Synthetic data only; never presented as a verified IMSS extract.
    return {
        "version": 1,
        "fuente": FUENTE,
        "documento": "Fixture sintética",
        "extraido_en": timezone.now().isoformat(),
        "medicamentos": [
            {
                "clave": "TEST-1",
                "nombre": "Ácido de prueba",
                "presentacion": "Presentación A",
            },
            {
                "clave": "TEST-2",
                "nombre": "Ácido de prueba",
                "presentacion": "Presentación B",
            },
        ],
    }


class CatalogoTests(APITestCase):
    def setUp(self):
        self.user, _ = medico()
        self.client.force_authenticate(self.user)

    def buscar(self, texto="acido"):
        return self.client.get("/api/catalogo/medicamentos", {"q": texto})

    def test_requires_medico(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.buscar().status_code, 401)

    def test_pending_hidden_and_published_search_preserves_variants(self):
        lote = importar(ejemplo())
        self.assertIsNone(self.buscar().data["catalogo"])
        publicar(lote.pk)
        response = self.buscar("ÁCIDO")
        self.assertEqual(len(response.data["resultados"]), 2)
        self.assertEqual(response.data["catalogo"]["fuente"], FUENTE)
        self.assertEqual(response["Cache-Control"], "no-store")
        self.assertEqual(self.buscar("TEST-2").data["resultados"][0]["clave"], "TEST-2")
        self.assertEqual(self.buscar("a").data["resultados"], [])
        self.assertEqual(self.buscar("x" * 101).status_code, 400)

    def test_reimport_is_idempotent_and_deduplicates_identical_rows_only(self):
        data = ejemplo()
        data["medicamentos"].append(deepcopy(data["medicamentos"][0]))
        lote = importar(data)
        self.assertEqual(lote.entradas.count(), 2)
        data["extraido_en"] = timezone.now().isoformat()
        self.assertEqual(importar(data).pk, lote.pk)
        self.assertEqual(LoteCatalogo.objects.count(), 1)

    def test_bad_import_does_not_replace_active(self):
        lote = importar(ejemplo())
        publicar(lote.pk)
        for rows in (
            [],
            [{"nombre": "Otro"}],
            [{"clave": "", "nombre": "", "presentacion": ""}],
        ):
            data = ejemplo()
            data["medicamentos"] = rows
            with self.assertRaises(ErrorCatalogo):
                importar(data)
        self.assertEqual(LoteCatalogo.objects.get(activo=True).pk, lote.pk)

    def test_publication_is_explicit_and_replaces_snapshot_atomically(self):
        first = importar(ejemplo())
        publicar(first.pk)
        data = ejemplo()
        data["medicamentos"][0]["nombre"] = "Otro producto"
        second = importar(data)
        self.assertEqual(LoteCatalogo.objects.get(activo=True).pk, first.pk)
        publicar(second.pk)
        self.assertEqual(LoteCatalogo.objects.get(activo=True).pk, second.pk)
        self.assertEqual(len(self.buscar("otro").data["resultados"]), 1)

    @override_settings(FIRECRAWL_API_KEY="test-only")
    @patch("catalogo.importacion.requests.post")
    def test_extraction_uses_fixed_api_and_no_publication(self, post):
        data = ejemplo()
        post.return_value = Mock(status_code=200)
        post.return_value.json.return_value = {
            "success": True,
            "data": {
                "json": {
                    "documento": data["documento"],
                    "medicamentos": data["medicamentos"],
                },
                "markdown": "Texto original",
                "links": [FUENTE + "/documento.pdf"],
            },
        }
        result = extraer(FUENTE)
        self.assertEqual(result["texto_fuente"], "Texto original")
        self.assertEqual(result["fuente"], FUENTE)
        self.assertEqual(LoteCatalogo.objects.count(), 0)
        args, kwargs = post.call_args
        self.assertEqual(args[0], "https://api.firecrawl.dev/v2/scrape")
        self.assertEqual(kwargs["json"]["url"], FUENTE)
        self.assertFalse(kwargs["allow_redirects"])
        self.assertNotIn("paciente", str(kwargs["json"]))

    @patch("catalogo.importacion.requests.post")
    def test_bad_urls_and_missing_key_do_not_call_provider(self, post):
        for url in (
            "http://imss.gob.mx/a",
            "https://imss.gob.mx.evil.test/a",
            "https://127.0.0.1/a",
            "https://user@imss.gob.mx/a",
        ):
            with self.assertRaises(ErrorCatalogo):
                extraer(url)
        with override_settings(FIRECRAWL_API_KEY=""):
            with self.assertRaises(ErrorCatalogo):
                extraer(FUENTE)
        post.assert_not_called()

    @override_settings(FIRECRAWL_API_KEY="test-only")
    @patch("catalogo.importacion.requests.post")
    def test_failed_extraction_preserves_active_and_hides_payload(self, post):
        lote = importar(ejemplo())
        publicar(lote.pk)
        post.return_value = Mock(status_code=403, text="private-provider-detail")
        with self.assertRaises(CommandError) as err:
            call_command("catalogo_imss", "extraer", stdout=StringIO())
        self.assertNotIn("private-provider-detail", str(err.exception))
        self.assertEqual(LoteCatalogo.objects.get(activo=True).pk, lote.pk)

    def test_invalid_publication_leaves_active(self):
        lote = importar(ejemplo())
        publicar(lote.pk)
        with self.assertRaises(CommandError):
            call_command(
                "catalogo_imss", "publicar", "--lote", "invalid", "--confirmar-revision"
            )
        self.assertEqual(LoteCatalogo.objects.get(activo=True).pk, lote.pk)

    def test_import_via_stdin_is_pending(self):
        output = StringIO()
        with patch(
            "catalogo.management.commands.catalogo_imss.sys.stdin",
            StringIO(json.dumps(ejemplo())),
        ):
            call_command("catalogo_imss", "importar", "--archivo", "-", stdout=output)
        self.assertIn("Lote pendiente:", output.getvalue())
        self.assertFalse(LoteCatalogo.objects.filter(activo=True).exists())

    @override_settings(FIRECRAWL_API_KEY="test-only")
    @patch("catalogo.importacion.requests.post")
    def test_index_without_rows_is_extractable_but_not_importable(self, post):
        post.return_value = Mock(status_code=200)
        post.return_value.json.return_value = {
            "success": True,
            "data": {
                "json": {"documento": "", "medicamentos": []},
                "links": [FUENTE],
            },
        }
        result = extraer(FUENTE)
        self.assertEqual(result["enlaces"], [FUENTE])
        with self.assertRaises(ErrorCatalogo):
            importar(result)

    def test_pdf_links_resolve_and_deduplicate_only_official_pdfs(self):
        from catalogo.importacion import enlaces_pdf

        urls = enlaces_pdf(
            {
                "fuente": FUENTE,
                "enlaces": [
                    "/sites/a.pdf",
                    "http://www.imss.gob.mx/sites/a.pdf#page=1",
                    "https://other.test/b.pdf",
                    "/sites/b.PDF",
                    "/otra-pagina",
                    "https://imss.gob.mx.evil.test/a.pdf",
                    123,
                ],
            }
        )
        self.assertEqual(
            urls,
            [
                "https://www.imss.gob.mx/sites/a.pdf",
                "https://www.imss.gob.mx/sites/b.PDF",
            ],
        )

    @patch("catalogo.importacion.extraer")
    def test_collection_extracts_every_pdf_once(self, scrape):
        from catalogo.importacion import extraer_pdfs

        doc = ejemplo()
        scrape.side_effect = [
            dict(doc, enlaces=["/a.pdf", "/b.pdf", "/a.pdf"]),
            dict(doc, fuente="https://www.imss.gob.mx/a.pdf"),
            dict(doc, fuente="https://www.imss.gob.mx/b.pdf"),
        ]
        result = extraer_pdfs(FUENTE, 2)
        self.assertEqual(len(result["documentos"]), 2)
        self.assertEqual(scrape.call_count, 3)
        self.assertFalse(LoteCatalogo.objects.exists())

    @patch("catalogo.importacion.extraer")
    def test_collection_limit_and_pdf_failure_never_create_partial_lot(self, scrape):
        from catalogo.importacion import extraer_pdfs

        index = dict(ejemplo(), enlaces=["/a.pdf", "/b.pdf"])
        scrape.return_value = index
        with self.assertRaises(ErrorCatalogo):
            extraer_pdfs(FUENTE, 1)
        self.assertEqual(scrape.call_count, 1)
        scrape.reset_mock()
        scrape.side_effect = [index, ejemplo(), ErrorCatalogo("PDF ilegible")]
        with self.assertRaises(ErrorCatalogo):
            extraer_pdfs(FUENTE, 2)
        self.assertFalse(LoteCatalogo.objects.exists())

    def test_collection_preserves_pdf_provenance_and_idempotence(self):
        from catalogo.importacion import importar_documentos

        a = dict(ejemplo(), fuente="https://www.imss.gob.mx/a.pdf")
        b = dict(ejemplo(), fuente="https://www.imss.gob.mx/b.pdf")
        collection = {"version": 1, "fuente": FUENTE, "documentos": [a, b]}
        lote = importar_documentos(collection)
        self.assertEqual(lote.entradas.count(), 4)
        collection["documentos"].reverse()
        self.assertEqual(importar_documentos(collection).pk, lote.pk)
        publicar(lote.pk)
        rows = self.buscar().data["resultados"]
        self.assertEqual(
            {r["fuente_documento"] for r in rows}, {a["fuente"], b["fuente"]}
        )
        self.assertTrue(all(r["documento"] and r["extraido_en"] for r in rows))

    def test_invalid_document_rejects_entire_collection(self):
        from catalogo.importacion import importar_documentos

        collection = {
            "version": 1,
            "fuente": FUENTE,
            "documentos": [ejemplo(), dict(ejemplo(), medicamentos=[])],
        }
        with self.assertRaises(ErrorCatalogo):
            importar_documentos(collection)
        self.assertFalse(LoteCatalogo.objects.exists())
