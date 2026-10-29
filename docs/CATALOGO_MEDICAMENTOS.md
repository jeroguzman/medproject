# Propuesta: catálogo de medicamentos del IMSS con Firecrawl

Fecha: 2026-10-28. Solicitud del usuario: aprovechar Firecrawl para un catálogo de
medicamentos basado en información pública de COFEPRIS. Estado de la propuesta original: diseño inicial. La implementación actual y su
operación se documentan en [CATALOGO_IMSS_OPERACION.md](CATALOGO_IMSS_OPERACION.md).
El código ya tiene extracción, lotes revisables, búsqueda y selección en el formulario;
aún no se han importado ni publicado datos reales.

## Fuente seleccionada por el usuario

El usuario seleccionó como fuente primaria el cuadro básico de medicamentos del
IMSS: http://www.imss.gob.mx/profesionales-salud/cuadros-basicos/medicamentos.
Esta decisión reemplaza COFEPRIS como fuente inicial del catálogo. Las referencias
a COFEPRIS más abajo conservan el contexto de la propuesta anterior.

La consulta a la variante HTTPS desde este entorno devolvió HTTP 403. No se han
verificado todavía el contenido de la página, sus enlaces de descarga, las fechas
ni los campos de sus documentos. No se ha ejecutado una extracción con Firecrawl.
El rechazo de red no demuestra que Firecrawl o el Droplet no puedan acceder.

El catálogo debe identificarse como procedente del IMSS y conservar el título,
versión/fecha y URL del documento realmente importado. No se presentará como un
listado de todos los medicamentos de México ni como confirmación de registro o
vigencia de COFEPRIS. Si los documentos contienen claves institucionales, se
conservarán con su tipo explícito; no se tratarán como registros sanitarios.

Siguiente paso: obtener los documentos enlazados desde esta página, inspeccionar
una muestra y definir el contrato de importación según sus campos reales. Si hay
un archivo estructurado, importarlo directamente; si es PDF, evaluar la extracción
con Firecrawl y comprobar que conserva asociaciones entre producto, presentación
y clave. Publicar solo lotes revisados, con búsqueda local y captura manual.

## Uso en MedVox

El médico busca un producto o sustancia al capturar un medicamento y selecciona
la entrada adecuada. La selección identifica el producto; dosis, vía, frecuencia
y duración siguen siendo revisadas/indicadas por el médico. El catálogo no genera
prescripciones ni completa tratamientos por inferencia. Conservar captura manual
cuando el medicamento no se encuentre, sin afirmar que carece de registro.

COFEPRIS es una posible fuente de registros sanitarios, no se asume que publique
un catálogo clínico completo con posología, interacciones o disponibilidad comercial.
Un registro sanitario no equivale por sí solo a recomendación clínica. La cobertura,
campos y significado del estado deben verificarse en la fuente concreta.

## Flujo propuesto

1. Identificar la fuente oficial concreta: página, buscador o conjunto descargable
   de COFEPRIS. Si existe descarga estructurada oficial, preferir importarla directamente.
2. Usar Firecrawl solo cuando se necesite extraer páginas/documentos accesibles y
   verificar que conserva filas, páginas y metadatos; no asumir compatibilidad con
   formularios interactivos, archivos escaneados o barreras de acceso.
3. Ejecutar la extracción como proceso administrativo independiente de la consulta
   clínica. No enviar nombres, expedientes, audio, notas ni datos de pacientes.
4. Validar y normalizar los resultados en un área de importación; revisión antes de
   publicarlos. No inventar campos ni transformar datos faltantes en afirmaciones.
5. Publicar un snapshot revisado en PostgreSQL, conservando fuente y fecha.
6. Exponer búsqueda/autocompletado desde Django. El frontend consulta nuestra API,
   sin claves de Firecrawl y sin depender de una petición externa por cada búsqueda.

Una importación fallida no vacía ni sustituye el último snapshot publicado. La
búsqueda puede usar la versión anterior, indicando su fecha, o permitir captura
manual. La información antigua no se presenta como confirmación de vigencia actual.

## Campos candidatos, por confirmar en la fuente

| Dato | Tratamiento |
|---|---|
| Nombre comercial | Solo si está publicado; no inferir a partir de la sustancia |
| Denominación genérica / sustancia | Mantener texto original y versión normalizada para búsqueda |
| Forma farmacéutica | Campo opcional según cobertura real |
| Concentración / presentación | Conservar unidades y texto originales, sin inferir equivalencias clínicas |
| Registro sanitario | Identificador de fuente cuando exista; comprobar unicidad real |
| Titular / fabricante | No confundir ambos conceptos; guardar solo lo identificado |
| Estado / vigencia | Preservar etiqueta y significado publicado; si no existe, desconocido |
| Fuente y fecha | URL oficial, fecha de extracción, versión/snapshot y dato original trazable |

No deduplicar solo por nombre: pueden existir diferentes presentaciones y registros.
Las reglas de identidad, variantes, actualizaciones y baja se fijan después de
examinar un conjunto representativo de resultados oficiales.

## Criterios de aceptación propuestos

- Búsqueda por nombre comercial o sustancia, sin distinguir acentos/mayúsculas.
- Cada resultado identifica su fuente, fecha y los campos disponibles.
- Una importación repetida no duplica entradas y un fallo no elimina el snapshot vigente.
- Revisar una muestra contra documentos originales antes de publicar el catálogo;
  discrepancias o campos faltantes impiden aprobar el lote afectado.
- No atribuir vigencia, dosis, equivalencia, indicación ni disponibilidad si la fuente
  no proporciona el dato correspondiente.
- Fallo de Firecrawl o de COFEPRIS no bloquea el formulario ni impide captura manual.
- Ninguna petición de importación contiene datos clínicos de pacientes; las claves
  permanecen en el entorno del backend, fuera del frontend, Git y logs.

## Responsabilidades propuestas

- Luis: verificar extracción, esquema de resultados y calidad frente a la fuente.
- Jeroben: modelos de catálogo/importación, publicación de snapshots y API de búsqueda.
- German: buscador/autocompletado, selección y presentación de fuente/fecha.

Esto amplía las funciones de apoyo de 006; no reemplaza automáticamente Tavily
para referencias web (RF-39), el catálogo CIE-10 (RF-41) ni la validación de alergias.
Antes de generar tareas nuevas, detallar esta funcionalidad en Spec Kit con el
contrato de la fuente real y conservar las tareas actuales de cada miembro.

## Prerrequisitos pendientes

- URL oficial exacta y representativa, y comprobación de sus campos/cobertura.
- Acceso de red a la fuente y a la documentación/API de Firecrawl.
- Credencial de Firecrawl configurada de forma segura al implementar, sin pedirla
  por chat. La clave por sí sola no prueba acceso a COFEPRIS.

En la revisión actual, las solicitudes a https://www.gob.mx/cofepris y
https://docs.firecrawl.dev/features/scrape devolvieron 403 desde la red de este
entorno. Esto no demuestra un bloqueo de COFEPRIS a Firecrawl: no se ha probado
ninguna extracción a través del servicio. No hay catálogo listo ni integración real.


### Seguimiento de localización de la fuente

El usuario no dispone de una URL específica: localizarla corresponde a la
investigación técnica, no es un requisito que deba resolver el usuario.
La política de red actual es restringida; www.gob.mx y cofepris.gob.mx no estaban
en sus reglas personalizadas. Se guardó su incorporación al borrador, junto a
docs.firecrawl.dev, conservando api.github.com. Guardar el borrador no aplica
la conectividad a la máquina actual ni demuestra acceso al contenido.

Después de habilitar la conectividad, comenzar por el portal oficial de COFEPRIS,
seguir sus enlaces a registros sanitarios de medicamentos y comprobar qué fuente
ofrece descarga o consulta pública. Registrar URL final, fecha, formato, campos y
muestra. No se ha validado aún un enlace específico de catálogo ni deben presentarse
rutas supuestas como una fuente oficial comprobada.
