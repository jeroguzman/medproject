# Catálogo IMSS: extracción, revisión y publicación

Estado: integración preparada; sin extracción real validada ni catálogo publicado.
Requiere desplegar esta rama/migración y FIRECRAWL_API_KEY en el Droplet. La clave
permanece en .env.production, pasa solo al backend y nunca se expone en el frontend.
La clave no se ha recibido ni utilizado en este entorno.

## 1. Extraer la fuente

La integración usa POST https://api.firecrawl.dev/v2/scrape con markdown, links y
extracción JSON con schema. Firecrawl puede consumir créditos. El comando extraer procesa una URL. El comando extraer-pdfs recorre los PDF
directamente enlazados desde el índice; no recorre otras páginas del sitio. La compatibilidad con
la página/PDF real debe probarse. No se envían datos de pacientes.

Desde /opt/vozclinica después de desplegar el código nuevo:

```bash
mkdir -p catalogo-importaciones
chmod 700 catalogo-importaciones
umask 077
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T backend python manage.py catalogo_imss extraer \
  > catalogo-importaciones/indice.pendiente.json
```

El archivo contiene fuente, fecha de extracción, documento, medicamentos, enlaces y
texto extraído. Un índice puede devolver cero medicamentos: revisar sus enlaces,
identificar un documento oficial y repetir la extracción de ese documento:

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T backend python manage.py catalogo_imss extraer \
  --url 'https://www.imss.gob.mx/RUTA_REAL_DEL_DOCUMENTO' \
  > catalogo-importaciones/documento.pendiente.json
```

Sustituir la ruta por un enlace real, no usar el ejemplo literalmente. Solo se
aceptan URLs HTTPS de imss.gob.mx y subdominios. Si la fuente solo ofrece HTTP,
verificar primero la disponibilidad de la misma descarga en HTTPS. Un 403 directo
desde este entorno no prueba si Firecrawl puede descargarla.

## Recorrer los PDF del índice (opción recomendada)

Después de desplegar la migración adicional de procedencia por medicamento:

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T backend python manage.py catalogo_imss extraer-pdfs --max-pdfs 20 \
  > catalogo-importaciones/coleccion.pendiente.json
```

El límite predeterminado es 20 documentos (máximo configurable: 1000). Si encuentra
más enlaces, informa el número y se detiene antes de extraer los PDF: aumentar el
límite explícitamente después de revisar créditos. Cada ejecución consume una
extracción del índice y hasta una por PDF. Las URLs repetidas se eliminan y los
enlaces HTTP del IMSS se prueban en HTTPS. Se excluyen dominios ajenos y páginas
que no terminan en .pdf. No se presupone que todos los enlaces sean medicamentos.

El archivo contiene una colección documentos, cada uno con URL, título, fecha,
texto y medicamentos. No se importa nada automáticamente. Si un PDF falla o no
contiene filas válidas, la operación falla y no emite una colección parcial.
No hay reanudación de descargas: reintentar puede volver a consumir créditos.
Un error puede dejar vacío el archivo de salida; no importarlo.

Para importar la colección revisada se usa el mismo comando importar --archivo -,
redirigiendo coleccion.pendiente.json. Se conserva la URL/título/fecha del PDF por
entrada y se muestra el documento al seleccionar el medicamento. Publicar sigue
siendo un paso separado y reemplaza el catálogo completo de forma atómica.

## 2. Revisar el lote

Comparar el JSON con el documento original, especialmente las asociaciones entre
nombre, clave y presentación y los saltos de tabla/página. Corregir el lote antes
de importarlo. No atribuir fecha de vigencia a extraido_en: solo es fecha técnica.
Completar documento con título/versión comprobados si la extracción no los devolvió.
Conservar los artefactos y el documento original como respaldo de la revisión.
El resultado puede ser parcial: no se anuncia cobertura completa ni vigencia actual.
Si se importan varios documentos, consolidar un lote revisado antes de publicar;
publicar un lote reemplaza el catálogo activo, no lo combina automáticamente.

Formato (estos datos son sintéticos, no un medicamento oficial):

```json
{
  "version": 1,
  "fuente": "https://www.imss.gob.mx/RUTA_REAL_DEL_DOCUMENTO",
  "extraido_en": "2026-10-28T18:00:00+00:00",
  "documento": "Título y versión comprobados",
  "medicamentos": [
    {"clave": "CLAVE-EJEMPLO", "nombre": "Ejemplo sintético", "presentacion": "Texto publicado"}
  ]
}
```

No se infieren posología, equivalencia, registro sanitario o disponibilidad. La
clave del IMSS es institucional, no un registro COFEPRIS. Los campos faltantes de
clave/presentación quedan vacíos; nombre siempre es obligatorio.

## 3. Importar sin publicar

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T backend python manage.py catalogo_imss importar --archivo - \
  < catalogo-importaciones/documento.pendiente.json
```

Anotar el UUID de lote devuelto. El lote sigue oculto. Reimportar el mismo
contenido no duplica medicamentos. No se deduplica únicamente por nombre: se
preservan presentaciones/claves distintas. Un error no modifica el catálogo activo.

## 4. Publicar después de revisar

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T backend python manage.py catalogo_imss publicar \
  --lote UUID_DEL_LOTE --confirmar-revision
```

La publicación reemplaza el lote activo en una transacción; se conservan los lotes
anteriores para poder volver a publicarlos por UUID. No se ejecuta al desplegar.

## 5. Probar en MedVox

Al escribir al menos dos caracteres en Medicamento, el formulario busca en el
snapshot activo. Muestra nombre, presentación y clave, fuente/documento/fecha de
extracción. Seleccionar cambia solo el nombre; el médico determina dosis, vía,
frecuencia y duración. La nota sigue el esquema clínico existente: esta primera
versión no guarda el ID del catálogo en la nota ni afirma trazabilidad por nota.

Sin snapshot, sin coincidencias o ante error de red, se permite captura manual.
En desarrollo con mocks no se inventa un catálogo. API autenticada:
GET /api/catalogo/medicamentos?q=texto; hasta 20 resultados, búsqueda sin acentos.

## Validación y pendientes

Las pruebas automatizadas simulan Firecrawl; no acreditan cobertura ni exactitud
real. Jeroben: despliegue, importación/publicación y API. Luis: revisar extracción
contra documentos originales y su cobertura. German: validar búsqueda, selección,
accesibilidad y captura manual en navegador con el backend real.
