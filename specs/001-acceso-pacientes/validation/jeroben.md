# Validación de Jeroben — backend de acceso y pacientes

Fecha: 2026-10-28. Código local, sin commit ni push de esta implementación.
Backend ejecutado con Python 3.12.14, Django 5.2.18 y PostgreSQL 16 en Docker.
Dependencias fijadas en requirements; configuración local ignorada por Git.

## Tareas completadas

T001, T003, T004, T005, T006, T009, T010, T012, T013, T014, T019, T020,
T021, T023, T024, T025, T026, T029, T036, T037 y T040: **21 de 23**.
Las fuentes de estado son las casillas de `tasks/jeroben.md`, sincronizadas con
la vista consolidada. No se marcan tareas de German ni Luis.

## Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| Checklist documental de la spec | 10/10 criterios marcados; solo lectura, sin modificar sus casillas |
| Primeras pruebas de autenticación antes de rutas | 2 fallos esperados por 404 frente a 401 |
| Primeras pruebas de pacientes antes de rutas | 2 fallos esperados por 404 frente a 201/401 |
| Primera prueba de lectura de notas antes de rutas | 1 fallo esperado por 404 frente a 401 |
| `docker compose --env-file backend/.env up -d --wait db` | PostgreSQL saludable |
| `python manage.py migrate --noinput` | Migraciones aplicadas, unaccent, secuencia y trigger de inmutabilidad |
| `python manage.py makemigrations --check --dry-run` | Sin cambios de modelo pendientes |
| `python manage.py check` | Sin incidencias |
| `DEBUG=false python manage.py check --deploy` | Sin incidencias; inspección de configuración, no un despliegue |
| `python manage.py cargar_demo`, dos ejecuciones | Dos médicos y seis pacientes, sin duplicar ni sobrescribir; sin notas y con aviso explícito |
| `python manage.py test cuentas pacientes notas tests --verbosity 1` | **37 pruebas ejecutadas, 37 aprobadas, 0 fallidas, 0 omitidas** |
| `ruff check --config backend/ruff.toml backend scripts/configure-backend-env.py` desde raíz | Sin incidencias |

Las pruebas incluyen login/me, usuarios inactivos o sin perfil, JWT expirado y
alterado, contrato OpenAPI, todos los endpoints clínicos sin autenticación,
campos de entrada no permitidos, búsqueda por nombre/expediente/fecha,
alta concurrente desde dos conexiones, rango de secuencia, idempotencia de demo,
PATCH, CORS exacto, políticas de redirección HTTPS y lectura inmutable.

La base de pruebas es independiente de la base de desarrollo y se elimina al
terminar. Los tests de lectura usan contenido sintético aislado; no constituyen
el conjunto de notas de demo validado con el esquema completo de Luis.

## Smoke HTTP real

Se inició el servidor Django en loopback y se realizaron peticiones reales:

- Login, me, salud y búsqueda: 200.
- Búsquedas García/garcia: misma paciente de demo.
- Alta de un paciente sintético de prueba: 201.
- PATCH de ese paciente: 200 y número de expediente intacto.
- Acceso a pacientes sin token: 401.

No se imprimieron tokens, contraseñas ni valores del archivo local. La prueba
HTTP dejó un paciente sintético adicional en desarrollo; no forma parte de las
seis fichas precargadas. Las pruebas automatizadas no dependen de ese registro.

## Pendientes concretos

- **T028**: se implementó la carga repetible de médicos y pacientes; falta cargar
  las notas previas y una nota corregida de demo usando el esquema v1.1 y los
  ejemplos completos de **Luis, T027/VC-01**. El comando no inventa un esquema
  reducido ni crea notas clínicas sin esa validación. Historia vacía es el estado
  real de los pacientes recién precargados.
- **T041**: CORS exacto, redirección HTTPS y exclusión de datos clínicos/tokens
  en logs están configurados y probados localmente. Falta verificar HTTPS/CORS en
  proveedor y dominio reales, aún no definidos. `check --deploy` y el cliente de
  pruebas no acreditan TLS de red ni una publicación.
- Frontend, aceptación E2E de German y contrato completo de Luis no ejecutados.
  La funcionalidad 001 integrada sigue pendiente de esas entregas.
- No se implementaron captura/IA ni escrituras de autorización/corrección de
  notas: pertenecen a las funcionalidades posteriores.

## Operación local

Seguir `docs/DESARROLLO.md`. Los secretos locales se generan con
`scripts/configure-backend-env.py`, sin sobrescribir archivos existentes.
Los usuarios de demo son pmendez y esalas; la contraseña está únicamente en la
configuración local DEMO_PASSWORD, no en este informe ni en el repositorio.
