# Tareas de German — acceso y pacientes

**Responsable**: German. **Rol**: A — frontend y coordinación de integración.
**Feature**: `001-acceso-pacientes`. **Estado**: pendientes.

Frontend, sus pruebas y el cierre integrado. Respeta las dependencias de API y esquema; los mocks permiten preparar pantallas, pero no completan E2E. No edites settings.py ni migraciones backend.

Este archivo es la fuente editable de tus casillas; no edites sus copias en
[../tasks.md](../tasks.md). Conserva IDs, etiquetas de historia y prioridades.
Tras cambiar una casilla, ejecuta desde la raíz:
`python3 scripts/sync-team-tasks.py`. Consulta [coordinación](coordination.md)
para orden, contratos y criterios de cierre.

## Phase 1: Setup — estructura y dependencias

- [ ] T002 [P] Inicializar React/TypeScript/Vite en `frontend/package.json`, `frontend/package-lock.json` y `frontend/src/main.tsx`; usar Node 22 LTS >=22.12, React Router, TanStack Query, Tailwind/shadcn y Lucide; definir scripts dev, test, build y test:e2e sin añadir una raíz npm de monorepo.

- [ ] T044 Añadir `frontend/.env.example` con VITE_API_URL público, sin secretos; entregar a Jeroben los orígenes frontend exactos y exclusiones node_modules/build para T004/T005. Conservar variables locales existentes y no editar simultáneamente `.gitignore` o `docs/DESARROLLO.md`, cuyo responsable es Jeroben.

## Phase 2: Foundational — base común

- [ ] T007 Crear el cliente HTTP en `frontend/src/api/client.ts` y tipos de error en `frontend/src/api/types.ts`, tomando VITE_API_URL; permitir inyectar token y callback de 401, distinguir fallo de red de lista vacía y no reintentar automáticamente escrituras.

- [ ] T008 Incorporar tokens del design system y estilos base en `frontend/src/styles/tokens.css` y `frontend/src/index.css`; configurar proveedores de consulta/router en `frontend/src/app/providers.tsx`, con tipografía, foco visible y componentes accesibles de shadcn sin exponer claves de servicios externos.

- [ ] T045 Configurar Vitest/Testing Library en `frontend/vitest.config.ts` y Playwright en `frontend/playwright.config.ts`, fijar herramientas y scripts en `frontend/package.json` y `frontend/package-lock.json`; usar API real y base de demo aislada para E2E, con URL/fixtures coordinadas con Jeroben en T009; no aceptar cero tests como éxito.

## Phase 3: User Story 1 — Acceder como médico (P1 / M)

- [ ] T011 [P] [US1] Escribir pruebas de login, rutas protegidas y salida en `frontend/src/features/auth/auth.test.tsx`: token `vozclinica:token`, claves `vozclinica:borrador:`/`vozclinica:correccion:`, cancelar conserva todo, confirmar elimina trabajo/token/caché, 401 no descarta borradores y no duplica escrituras.

- [ ] T015 [US1] Implementar estado de sesión y conexión con cliente HTTP en `frontend/src/features/auth/session.ts` y `frontend/src/api/auth.ts`; restaurar token, consumir me y limpiar token/cachés ante 401 manteniendo borradores locales; no presentar salida local como revocación del JWT emitido.

- [ ] T016 [US1] Crear `/login`, protección de rutas y layout autenticado en `frontend/src/pages/LoginPage.tsx`, `frontend/src/components/AppLayout.tsx` y `frontend/src/app/router.tsx`; mostrar médico, cédula, Cerrar sesión y Datos ficticios; permitir pegar contraseñas y mostrar errores accesibles; usar página de destino provisional sin fingir lista de pacientes disponible.

- [ ] T017 [US1] Implementar confirmación Seguir trabajando / Descartar y salir en `frontend/src/components/LogoutDialog.tsx` y `frontend/src/features/auth/logout.ts`; eliminar solo claves de trabajo de VozClínica al confirmar, token y cachés, sin modificar notas del servidor; integrar con `frontend/src/components/AppLayout.tsx`.

- [ ] T018 [US1] Ejecutar tests de US1 y agregar recorrido integrado con API real en `frontend/e2e/auth.spec.ts`; cubrir acceso válido, inválido, teclado y salida con borrador sintético local; registrar comandos/conteos/resultados en `specs/001-acceso-pacientes/validation/german.md`, distinguiendo lo ejecutado de lo pendiente. German escribe las pruebas frontend; Jeroben proporciona API, base de pruebas y resultados de suites backend. La tarea se completa solo con la evidencia de ambas partes requerida por el escenario.

## Phase 4: User Story 2 — Encontrar y registrar al paciente correcto (P1 / M)

- [ ] T022 [P] [US2] Escribir pruebas de interfaz en `frontend/src/features/pacientes/pacientes.test.tsx`: búsquedas fuera de orden, errores distintos de vacío, aviso de coincidencias, abrir existente/confirmar nuevo, registro mínimo y presentación de nacimiento sin desplazamiento UTC; escribir pruebas de lectura/selección de versiones en `frontend/src/features/notas/nota.test.tsx`.

- [ ] T030 [US2] Implementar nombres de cabecera, edad y fechas locales en `frontend/src/lib/formatos.ts`: APELLIDOS, Nombre(s), DD/mmm/AAAA, 24 h, edad en meses antes de 2 años/días antes de 1 mes; probar límites de cumpleaños/mes en `frontend/src/lib/formatos.test.ts` sin convertir nacimiento ISO mediante UTC.

- [ ] T031 [US2] Crear consumidores y tipos de pacientes/notas en `frontend/src/api/pacientes.ts`, `frontend/src/api/notas.ts` y `frontend/src/api/clinical-types.ts`, alineados con OpenAPI; usar query keys por paciente/nota y cancelación o descarte de respuestas antiguas; no añadir endpoints de duplicados ni autorización.

- [ ] T032 [US2] Crear lista/buscador y registro en `frontend/src/pages/PacientesPage.tsx` y `frontend/src/components/PacienteForm.tsx`; mínimos y límites idénticos al contrato, posibles duplicados combinados por id desde búsquedas nombre/fecha antes del POST, acciones Abrir expediente / No es ninguno: registrar nuevo, alta con número solo del servidor y estados carga/error/vacío accesibles.

- [ ] T033 [US2] Crear expediente, cabecera e historial en `frontend/src/pages/PacienteDetailPage.tsx`, `frontend/src/components/PacienteHeader.tsx` y `frontend/src/components/NotasHistory.tsx`; mostrar alergias, fecha, diagnóstico, médico, estado y versión, distinguir vacío de error y conservar contexto al navegar. Registrar rutas en `frontend/src/app/router.tsx`; Nueva consulta solo enlaza a 002 cuando la ruta exista, sin simular captura implementada.

- [ ] T034 [US2] Crear detalle y selector de versiones de solo lectura en `frontend/src/pages/NotaDetailPage.tsx` y `frontend/src/components/NotaReadOnly.tsx`; renderizar el formato completo de §7, no solo el resumen, mostrar origen/estados del contenido y autor/fecha/motivo por versión; usar la plantilla compartida sin inventar campos, sin edición/autorización/corrección de 004/005.

- [ ] T035 [US2] Completar tests de US2 y recorridos integrados en `frontend/e2e/pacientes.spec.ts` y `frontend/e2e/notas.spec.ts` con API/PostgreSQL reales; ejecutar cargar_demo dos veces y pruebas de concurrencia, contrato y lectura inmutable; registrar conteos/resultados y cualquier bloqueo de esquema en `specs/001-acceso-pacientes/validation/german.md`. No aceptar US2 completa si el historial solo funciona con mocks. German escribe las pruebas frontend; Jeroben proporciona API, base de pruebas y resultados de suites backend. La tarea se completa solo con la evidencia de ambas partes requerida por el escenario.

## Phase 5: User Story 3 — Corregir la ficha del paciente (P2 / S)

- [ ] T038 [US3] Reutilizar formulario para edición de ficha en `frontend/src/components/PacienteForm.tsx`, agregar PATCH en `frontend/src/api/pacientes.ts` e integrar acción en `frontend/src/pages/PacienteDetailPage.tsx`; invalidar cachés de ficha/lista tras éxito sin cambiar el contenido de versiones de notas ni abrir edición de identificación en la nota.

- [ ] T039 [US3] Verificar actualización de ficha, errores y expediente inmutable con tests de componente en `frontend/src/features/pacientes/editar-paciente.test.tsx` y E2E en `frontend/e2e/editar-paciente.spec.ts`; ejecutar backend S01 y registrar resultados en `specs/001-acceso-pacientes/validation/german.md`; si la mejora se difiere, reportarla pendiente sin bloquear aceptación M. German escribe las pruebas frontend; Jeroben proporciona API, base de pruebas y resultados de suites backend. La tarea se completa solo con la evidencia de ambas partes requerida por el escenario.

## Phase 6: Polish — aceptación transversal

- [ ] T042 Verificar WCAG 2.2 AA y presentación de flujos entregados con revisión manual y pruebas automatizadas en `frontend/e2e/accessibility.spec.ts`: teclado, foco/diálogos, contraste, etiquetas/errores, icono y texto además de color, español de México, fechas y Datos ficticios; no equiparar un análisis automático con conformidad completa.

- [ ] T043 Ejecutar la guía `specs/001-acceso-pacientes/quickstart.md` con backend, PostgreSQL y frontend reales: instalación reproducible, migraciones, carga idempotente, suites con conteos mayores que cero, build y E2E. Actualizar `specs/001-acceso-pacientes/validation/german.md`, `specs/001-acceso-pacientes/quickstart.md` y `README.md` con comandos/resultados, pendientes S y límites; no declarar 001 lista si falta lectura completa o comprobaciones requeridas. German coordina la ejecución con Jeroben y Luis, consolida sus evidencias sin cambiarlas en `specs/001-acceso-pacientes/validation.md` y recoge de Jeroben los cambios de documentación backend; no marca tareas ajenas ni omite bloqueos.
