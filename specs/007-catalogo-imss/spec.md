# 007 — Catálogo IMSS de medicamentos

Decisión del usuario: sustituir COFEPRIS por la página de cuadros básicos del IMSS
como fuente inicial y usar Firecrawl para la extracción. El usuario confirmó que
configuró la clave en el Droplet; no se conoce ni se ha utilizado en este entorno.

El médico puede buscar por nombre, clave o presentación al revisar un medicamento.
La selección solo escribe nombre; no prescribe ni modifica posología. Se mantiene
captura manual y se muestran fuente/documento/fecha del snapshot. El primer alcance
no cambia el esquema de notas ni almacena un identificador de catálogo en cada nota.

La extracción es administrativa y no lleva datos clínicos. Importar genera un lote
pendiente; publicar requiere revisión explícita. Solo se busca en el snapshot activo.
Una extracción fallida no vacía datos; publicar otro lote reemplaza el snapshot
atómicamente. No se considera el cuadro básico un registro COFEPRIS ni cobertura
nacional completa. La publicación de datos reales está pendiente de validación.

Aceptación: búsqueda autenticada sin acentos; fuente/fecha visible; variantes con
mismo nombre preservadas; reimportación sin duplicados; lote inválido no altera
publicación; captura manual ante fallo; claves ausentes del frontend.
