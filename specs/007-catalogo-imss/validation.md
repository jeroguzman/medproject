# Validación local

- Backend: 106 pruebas aprobadas sobre PostgreSQL, incluyendo 11 del catálogo.
- Frontend: 30 pruebas existentes aprobadas y build TypeScript/Vite aprobado.
- Ruff y makemigrations --check --dry-run: aprobados.
- Compose config --quiet y workflow que incluye catalogo: válidos.

Pruebas del catálogo: autenticación, búsqueda sin acentos, variantes, idempotencia,
publicación explícita, rechazo de lotes inválidos, preservación del snapshot,
extracción simulada, URLs restringidas, ausencia de clave, importación vía stdin e
índice sin filas. No se enviaron solicitudes reales a Firecrawl ni se usó la clave
que el usuario configuró en el Droplet.

Pendiente: extracción real del IMSS, cobertura/calidad de páginas/PDF, revisión del
lote y validación del buscador en navegador. No se acredita compatibilidad del
proveedor real mediante mocks. No hay catálogo oficial publicado en estas pruebas.

Ampliación PDF: 16 pruebas del catálogo aprobadas (5 nuevas), incluyendo recorrido,
normalización/deduplicación de enlaces, límite de coste, rechazo del lote parcial,
procedencia individual e importación idempotente de colecciones. Build frontend y
comprobación de migraciones aprobados. Sigue pendiente validar PDF reales.
