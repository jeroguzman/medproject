# GET /api/catalogo/medicamentos?q=texto

Requiere JWT y médico activo. q: máximo 100 caracteres; menos de 2 devuelve lista
vacía. Busca por nombre/clave/presentación, sin acentos ni mayúsculas. Hasta 20
resultados ordenados por nombre, clave e ID. No realiza consultas externas.

200: {"catalogo": null, "resultados": []} cuando no hay lote publicado.
Con catálogo: catalogo contiene id (UUID), fuente (URL IMSS), documento y extraido_en
(ISO 8601). Cada resultado tiene id, clave, nombre, presentacion. No incluye dosis
ni estado de registro sanitario. Cache-Control: no-store. Consulta larga: 400;
sin autenticación: 401; sin perfil médico: 403.

Administración: python manage.py catalogo_imss extraer [--url HTTPS_IMSS]; importar
--archivo RUTA (o - para stdin); publicar --lote UUID --confirmar-revision.
No existen endpoints públicos de importación o publicación.
