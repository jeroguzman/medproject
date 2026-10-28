# Validación de Jeroben — backend de acceso y pacientes

Actualización: 2026-10-28. Rama local: codex/deploy-digitalocean-droplet.
Python 3.12.14, Django 5.2.18 y PostgreSQL 16. Esta actualización de fixtures y
preparación de despliegue no tiene commit ni push todavía.

## Estado de tareas

**22 de 23 completadas.** Se completó T028 al recibir el esquema de Luis desde
main; solo T041 continúa pendiente de comprobación en el Droplet y dominio reales.
Las casillas de `tasks/jeroben.md` son la fuente de estado. No se marcan tareas
ni aceptación E2E de German o Luis.

## Evidencia actual

| Comprobación | Resultado |
|---|---|
| `python ia/verificar_vc01.py` | Esquema, contenido vacío y dos ejemplos completos válidos |
| `python manage.py test cuentas pacientes notas tests --verbosity 1` | **47 ejecutadas, 47 aprobadas, 0 fallidas, 0 omitidas** |
| Primera prueba de T028 antes de implementar | Falló: había 0 notas frente a 5 esperadas |
| `python manage.py cargar_demo` primera carga completa | 5 notas nuevas; 6 versiones completas |
| Segunda carga | 0 notas nuevas; versiones y contenido conservados |
| `python manage.py makemigrations --check --dry-run` | Sin cambios pendientes |
| Ruff y sincronización de tareas | Sin incidencias |
| Contenedor producción, `check --deploy` | Sin incidencias; no acredita despliegue público |

Las 47 pruebas comprenden las 37 previas, 4 de infraestructura/proxy y 6 de la
carga completa. Cubren autenticación, contrato API, permisos, búsqueda sin acentos,
fechas, registro y concurrencia de expedientes, PATCH, lectura e inmutabilidad,
CORS, proxy HTTPS, disponibilidad y comportamiento de importación.

El runner fue comprobado para rechazar una suite de cero pruebas. La base de
pruebas es independiente de desarrollo y se elimina al terminar. No se necesitan
credenciales externas ni llamadas a IA para ejecutar estas comprobaciones.

## T028 — fixtures completas y repetibles

`backend/notas/fixtures/demo/notas.json` incluye las cinco notas previas de la
guía de backend §9, con seis versiones y una corrección de demostración. Todas
las secciones del contenido se validan mediante `vozclinica_ia.esquema` de Luis.
Los campos capturados son manuales; no se inventa evidencia ni una transcripción.

La carga valida el lote completo antes de escribir. Si un campo es inválido, no
crea médicos, pacientes ni notas. Una plantilla existente con el mismo número de
versión pero distinto esquema bloquea la carga, sin reemplazarla. El comando es
transaccional y serializa las importaciones administrativas concurrentes.

Se comprobó que repetir la carga conserva contraseñas, cambios manuales de ficha,
contenido de versiones y correcciones clínicas posteriores. Las identidades de
las notas se basan en paciente, médico, plantilla, fecha y hora; no se reinicia la
base. `--solo-medicos` conserva su alcance y no carga notas ni pacientes.

`jsonschema` y sus dependencias pasan a requirements de ejecución. La imagen
incluye el módulo de esquema y sus archivos compartidos bajo `/app/ia`; no depende
de una copia distinta o un esquema reducido dentro del backend.

## Verificación HTTP/HTTPS

La API ya se había comprobado por HTTP real para acceso/pacientes: login/me/salud
200, alta 201, PATCH 200 sin cambiar expediente y acceso sin JWT 401. Ese smoke
previo dejó un paciente sintético adicional en la base de desarrollo, fuera de
las seis fichas precargadas; las pruebas no dependen de ese registro.

Después de incorporar T028 se construyó la imagen y arrancó un Compose aislado.
Mediante HTTPS local con Caddy y validación de su CA se comprobó:

- Cinco notas y seis versiones devueltas por historial/detalle real.
- Todas las versiones devueltas cumplen el esquema clínico completo.
- La nota corregida muestra v2 y permite consultar v1.
- Una segunda carga deja las respuestas de detalle idénticas.
- El contenedor pasa `check --deploy`.

El build local utilizó las wheels fijadas descargadas por HTTPS en el host porque
el DNS/proxy dentro del builder de este entorno no llega a PyPI. Se mantuvo TLS
verificado. Ver `deploy/VALIDACION.md` para ese límite de validación del build.

## Pendiente

**T041:** falta comprobar DNS, certificado público, proveedor, dominio y CORS real
en el Droplet. Los tests y certificados locales no equivalen a una publicación.
La integración E2E del frontend sigue siendo una entrega separada.

No se implementaron nuevas rutas de autorización/corrección ni un pipeline de
captura/IA en este cambio; las fixtures se cargan mediante un comando administrativo
explícito. No se modificaron los datos ni servicios de un Droplet real.
