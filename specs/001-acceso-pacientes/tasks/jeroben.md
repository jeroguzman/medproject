# Tareas de Jeroben — acceso y pacientes

**Responsable**: Jeroben. **Rol**: B — backend, PostgreSQL e infraestructura.
**Feature**: `001-acceso-pacientes`. **Estado**: 21 completadas; T028 y T041 pendientes.
**Evidencia**: [validación de Jeroben](../validation/jeroben.md).

Backend, migraciones, datos ficticios y permisos; mantiene compose.yaml, .gitignore y documentación compartida de configuración. Proporciona API y resultados backend a German para pruebas integradas.

Este archivo es la fuente editable de tus casillas; no edites sus copias en
[../tasks.md](../tasks.md). Conserva IDs, etiquetas de historia y prioridades.
Tras cambiar una casilla, ejecuta desde la raíz:
`python3 scripts/sync-team-tasks.py`. Consulta [coordinación](coordination.md)
para orden, contratos y criterios de cierre.

## Phase 1: Setup — estructura y dependencias

- [x] T001 Crear el esqueleto Django 5.2/Python 3.12 en `backend/manage.py`, `backend/vozclinica/` y apps `backend/cuentas/`, `backend/pacientes/`, `backend/notas/`; resolver dependencias del plan y fijar versiones compatibles en `backend/requirements.txt`, separando herramientas de prueba en `backend/requirements-dev.txt`.

- [x] T003 [P] Definir PostgreSQL 16 para desarrollo/pruebas en `compose.yaml`, con credenciales tomadas de variables locales, comprobación de salud y persistencia solo de la base; documentar acceso a unaccent y creación de base de tests en `docs/DESARROLLO.md`; no iniciar IA ni n8n para esta fase.

- [x] T004 Añadir variables backend sin valores secretos en `backend/.env.example` y exclusiones compartidas en `.gitignore`; documentar DATABASE_URL, DJANGO_SECRET_KEY, ALLOWED_HOSTS y CORS_ALLOWED_ORIGINS en `docs/DESARROLLO.md`, preservar archivos previos y distinguir HTTP local de HTTPS desplegado. Jeroben mantiene estos archivos compartidos; recibe de German las variables y orígenes frontend de T044.

## Phase 2: Foundational — base común

- [x] T005 Configurar PostgreSQL, apps, zona America/Mexico_City, idioma es-mx, JWT de acceso de 12 horas sin refresh y autenticación predeterminada en `backend/vozclinica/settings.py`; limitar CORS a orígenes exactos, manejar configuración por entorno y mantener logs sin tokens ni cuerpos clínicos.

- [x] T006 Definir errores `{error:{codigo,mensaje}}`, validación con faltantes/detalles, 404 uniforme y permiso de usuario activo con perfil médico en `backend/vozclinica/exceptions.py` y `backend/cuentas/permissions.py`; conectar el manejador en `backend/vozclinica/settings.py` y rutas sin slash final en `backend/vozclinica/urls.py`.

- [x] T009 Preparar descubrimiento de pruebas Django y validación de respuestas contra `specs/001-acceso-pacientes/contracts/openapi.json` en `backend/tests/contracts.py`; fijar herramientas en `backend/requirements-dev.txt`, usar PostgreSQL con base de pruebas aislada y evitar que cero tests cuente como éxito. Coordinar con German los datos de API necesarios para T045.

## Phase 3: User Story 1 — Acceder como médico (P1 / M)

- [x] T010 [P] [US1] Escribir pruebas de contrato/permisos para POST /api/auth/login y GET /api/auth/me en `backend/cuentas/tests/test_auth.py`: casos A01–A04, usuario inactivo, sin perfil, token expirado/alterado, access sin datos clínicos y nombres usuario/contrasena → access/medico; verificar fallos antes de la implementación de la historia.

- [x] T012 [US1] Crear Medico y migración inicial en `backend/cuentas/models.py` y `backend/cuentas/migrations/0001_initial.py`: usuario «OneToOne protegido frente a eliminación», nombre_completo «(200)», cedula_profesional «(20)», especialidad «(100), todos obligatorios»; conservar User estándar de Django y contraseña hasheada, sin registro público.

- [x] T013 [US1] Crear carga idempotente de los dos médicos de guía backend §9 en `backend/cuentas/demo.py` y el comando `backend/notas/management/commands/cargar_demo.py`; en esta etapa cargar solo médicos, sin duplicar ni sobrescribir usuarios existentes, sin reset destructivo y sin registrar contraseñas.

- [x] T014 [US1] Implementar login/me en `backend/cuentas/serializers.py`, `backend/cuentas/views.py` y `backend/cuentas/urls.py`; credenciales inválidas/inactivo producen 401, usuario sin perfil no recibe acceso clínico, respuesta devuelve identidad profesional según OpenAPI; no añadir refresh ni logout remoto.

## Phase 4: User Story 2 — Encontrar y registrar al paciente correcto (P1 / M)

- [x] T019 [P] [US2] Escribir pruebas de búsqueda, alta, detalle y permisos en `backend/pacientes/tests/test_api.py`, casos P01–P05 y N02: acentos/mayúsculas, expediente, fechas ISO/DD/MM/AAAA, búsqueda vacía, mínimos, nacimiento futuro, enum sexo, campos internos rechazados y ausencia de altas al fallar; verificar respuestas contra OpenAPI.

- [x] T020 [P] [US2] Escribir pruebas de historial y detalle en `backend/notas/tests/test_read_api.py`, casos N01–N03: diagnóstico de versión vigente, orden fecha/hora descendente con desempate id, versiones descendentes, contenido/autor/fecha/motivo intactos, 404, permisos y ausencia de métodos de escritura de notas en 001.

- [x] T021 [P] [US2] Escribir TransactionTestCase sobre PostgreSQL en `backend/pacientes/tests/test_expedientes.py`: altas simultáneas con expedientes distintos, restricción UNIQUE, inicio en 48300 o superior al importado, inicialización idempotente sin rebobinar, formato 0000-0000 y rechazo de desbordamiento; no exigir ausencia de huecos.

- [x] T023 [US2] Crear Paciente y migración en `backend/pacientes/models.py` y `backend/pacientes/migrations/0001_initial.py`: numero_expediente «Único, formato `0000-0000`, inmutable»; nombres «Texto requerido, máximo 100; recortar espacios externos»; apellido_paterno «Texto requerido, máximo 100»; apellido_materno «Máximo 100; ausencia normalizada a cadena vacía»; fecha_nacimiento «Fecha válida, no futura»; sexo «mujer / hombre / no_especificado»; alergias «Texto requerido no vacío; Sin alergias conocidas se expresa explícito»; tipo_sangre «Máximo 3, vacío permitido»; telefono «Máximo 20, opcional; null de entrada se normaliza a vacío interno»; creado_por «Médico de la sesión, relación protegida», creado_en «Fecha/hora del servidor»; memoria_ref «Opcional, reservado a 006», no expuesto; id solo lectura y edad no persistida.

- [x] T024 [US2] Crear unaccent y secuencia de expediente en `backend/pacientes/migrations/0002_busqueda_expediente.py` y asignación transaccional en `backend/pacientes/services.py`; respetar inicio 48300, máximo importado y secuencia no rebobinada; no usar max+1 sin bloqueo; completar inicialización antes de aceptar altas.

- [x] T025 [US2] Implementar GET/POST /api/pacientes y GET /api/pacientes/{id} en `backend/pacientes/serializers.py`, `backend/pacientes/views.py` y `backend/pacientes/urls.py`; unaccent en nombres/apellidos, expediente y fecha exacta cuando q sea fecha, sin paginación; rechazo explícito de campos fuera de contrato, creado_por de sesión y total_notas/ultima_consulta derivados (0/null sin notas). PATCH sigue pendiente de US3.

- [x] T026 [US2] Crear Plantilla/Nota/VersionNota y migración en `backend/notas/models.py` y `backend/notas/migrations/0001_initial.py`: Plantilla con «unicidad de clave/versión»; Nota con relaciones protegidas, tipo «primera_vez/seguimiento», modo «dictado/consulta», estado «autorizada/corregida» y versión vigente; VersionNota con «número positivo», «transcripción opcional», «Unicidad de nota/número; versiones inmutables» y «motivo es obligatorio desde la versión 2»; incluir contenido según plantilla, consentimiento, autor y fechas, sin tabla de borradores/audio.

- [ ] T028 [US2] Extender `backend/notas/management/commands/cargar_demo.py` y agregar fixtures sintéticas en `backend/notas/fixtures/demo/` con los seis pacientes de guía backend §9 y sus notas previas válidas contra el esquema de 003; conservar alergia a penicilina, autores y fechas documentadas, incluir una nota corregida de prueba con dos versiones; validar todo antes de escribir, sin duplicar ni sobrescribir datos, y ajustar secuencia solo hacia delante. Depende del esquema compartido verificado.

- [x] T029 [US2] Implementar GET /api/pacientes/{id}/notas y GET /api/notas/{id} en `backend/notas/serializers.py`, `backend/notas/views.py` y `backend/notas/urls.py`; incluir plantilla, paciente, médico y todas las versiones según OpenAPI, diagnóstico vigente/null, orden estable y sin audio; evitar consultas N+1 y mantener métodos de escritura deshabilitados.

## Phase 5: User Story 3 — Corregir la ficha del paciente (P2 / S)

- [x] T036 [P] [US3] Escribir pruebas PATCH y autorización en `backend/pacientes/tests/test_patch.py`: mínimos/límites/enum de Paciente, cambio de ficha, rechazo de numero_expediente/creado_por/contadores, ausencia de mutación en contenido histórico y 401/403/404 según contrato; caso S01 del quickstart.

- [x] T037 [US3] Implementar PATCH /api/pacientes/{id} usando campos permitidos y validación parcial en `backend/pacientes/serializers.py` y `backend/pacientes/views.py`; mantener «numero_expediente: Único, formato `0000-0000`, inmutable», autoría y fechas internas solo lectura; no agregar editor de tipo_sangre, memoria_ref ni propiedades derivadas.

## Phase 6: Polish — aceptación transversal

- [x] T040 Verificar todos los endpoints implementados de `specs/001-acceso-pacientes/contracts/openapi.json` con pruebas transversales en `backend/tests/test_contract_security.py`: status/cuerpos, token inválido y permisos médicos, datos internos rechazados, 404 y métodos clínicos de escritura ausentes; si PATCH S no se entrega, registrar explícitamente esa excepción de alcance.

- [ ] T041 Validar configuración de despliegue HTTPS/CORS y ausencia de tokens/cuerpos clínicos en logs; actualizar `docs/DESARROLLO.md` y `backend/vozclinica/settings.py` con configuración segura por entorno, sin elegir ni publicar proveedor no acordado; distinguir comprobación local de verificación HTTPS real y registrar lo que falte en `specs/001-acceso-pacientes/validation/jeroben.md`.
