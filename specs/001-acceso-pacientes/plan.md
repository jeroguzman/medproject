# Implementation Plan: Acceso del médico y gestión de pacientes

**Branch**: `work` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-acceso-pacientes/spec.md`.
El identificador de funcionalidad que devuelve setup-plan es `001-acceso-pacientes`;
la rama Git real sigue siendo `work`.

## Summary

Entregar acceso del médico, búsqueda y registro de pacientes ficticios, cabecera,
historial y lectura de notas/versiones. Se usa el contrato existente de la guía
backend §6 y la interacción de la guía frontend §6. La edición de ficha es S;
la captura, autorización y corrección quedan en 002–005. Para demostrar historial
sin esperar escrituras clínicas se precargan notas y versiones sintéticas válidas.

El diseño siguiente guía la implementación; el avance backend está documentado
en [validation/jeroben.md](validation/jeroben.md). Por decisión explícita del
usuario, el frontend estará en `frontend/` en este mismo repositorio, junto con
`backend/`, `ia/` y `n8n/`. Esta decisión reemplaza la separación de §9.6 y las
guías; Lovable puede usarse como herramienta, pero no determina la ubicación.

## Technical Context

**Language/Version**: Python 3.12 para backend; TypeScript para frontend.

**Primary Dependencies**: Django 5.2 LTS, DRF, SimpleJWT, django-cors-headers,
psycopg 3, dj-database-url, Gunicorn y WhiteNoise. Versiones exactas compatibles
se resolverán y fijarán al implementar. React, TypeScript, Vite, React Router, TanStack Query, Tailwind, shadcn/ui y Lucide
en `frontend/`, conforme al stack de la guía. Node.js 22 LTS (>=22.12) como baseline
propuesto; las versiones compatibles se fijan al crear package.json y package-lock.json.

**Storage**: PostgreSQL 16 como base de desarrollo propuesta, con extensión
`unaccent`; mismo motor en pruebas. Perfil Medico OneToOne con el usuario Django.
JWT de acceso en el navegador conforme a la guía, sin refresh en el MVP.

**Testing**: Django TestCase/APITestCase sobre PostgreSQL; tests de contrato OpenAPI;
prueba de concurrencia de expedientes con TransactionTestCase. En el frontend,
Vitest y Testing Library para componentes; Playwright para flujos de navegador.
Son herramientas propuestas, aún no instaladas.

**Target Platform**: backend Linux; frontend HTTPS en Chrome/Edge recientes,
escritorio 1366 × 768; español de México y zona America/Mexico_City.

**Project Type**: monorepositorio con API Django y frontend React; dependencias separadas por directorio.

**Performance Goals**: corrección funcional con 6–8 pacientes y pocas notas;
no hay SLO de búsqueda ni objetivo de carga definido en las fuentes. Sin paginación
para el MVP. Medir consultas y evitar una consulta adicional por cada fila.

**Constraints**: datos ficticios, autenticación en operaciones clínicas, CORS con
orígenes exactos y transporte HTTPS. No persistir borradores/audio. Sin roles extra,
Supabase, agenda, registro público de médicos ni revocación global de JWT.

**Scale/Scope**: RF-01–RF-07 M; RF-08 S. Lectura de modelos clínicos compartidos,
con escritura de notas reservada a 004/005. No se necesitan IA ni n8n para esta fase.

## Constitution Check

*GATE antes de investigación y después del diseño: aprobado a nivel documental.*

| Principio | Antes de Phase 0 | Después de Phase 1 |
|---|---|---|
| I. Alcance trazable | RF-01–08 y RNF aplicables delimitados | Contratos cubren acceso, pacientes y lectura; PATCH sigue siendo S |
| II. Autorización y versiones | No se añaden escrituras de notas | Solo GET para notas/versiones; fixtures sintéticos separados del flujo clínico |
| III. Privacidad | Datos de demo y autenticación requeridos | Sin cuerpos clínicos en logs; salida explícita elimina borradores tras confirmación |
| IV. Contratos | Guía backend §6 como fuente | OpenAPI conserva rutas y formas; esquema clínico completo pertenece a 003 |
| V. Evidencia | Escenarios de spec identificados | Quickstart incluye casos positivos, negativos, concurrencia y lectura inmutable |

No hay excepción constitucional. La evidencia backend está en el informe de Jeroben;
la aceptación integrada requiere además frontend y el esquema clínico compartido.

## Project Structure

### Documentation (this feature)

```text
specs/001-acceso-pacientes/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/
    ├── openapi.json
    └── ui.md
```

El desglose de implementación está en [tasks.md](tasks.md), generado con
`$speckit-tasks` y organizado por responsable. Las fuentes editables son
[German](tasks/german.md), [Jeroben](tasks/jeroben.md) y [Luis](tasks/luis.md);
la vista consolidada se regenera con `python3 scripts/sync-team-tasks.py`.
Las casillas reflejan el avance verificado de cada responsable.

### Source Code (repository root)

Backend implementado; frontend todavía previsto:

```text
backend/
├── manage.py
├── requirements.txt
├── medvox/                 # settings, urls, wsgi
├── cuentas/                    # perfil, login, me y tests
├── pacientes/                  # búsquedas, registro, detalle y tests
└── notas/                      # modelos compartidos y lectura; sin autorizar aún
    └── management/commands/    # cargar_demo idempotente
```

Frontend previsto en este mismo repositorio:

```text
frontend/
└── src/
    ├── api/                        # cliente HTTP y contratos de esta funcionalidad
    ├── components/             # cabecera, historial, registro y diálogo de salida
    ├── pages/                  # login, pacientes, expediente y nota de solo lectura
    └── mocks/                  # los mismos fixtures ficticios que backend
```

**Structure Decision**: `frontend/` y `backend/` comparten repositorio por decisión
del usuario; se conserva la organización backend de la guía. No añadir otro
repositorio ni otro esquema de autorización. Cada componente conserva su lockfile
y proceso de desarrollo; no se necesita añadir un gestor de monorepo. Los modelos
mínimos Nota/VersionNota se comparten con las fases 004/005.

## Phase 0 — Investigación

[research.md](research.md) registra decisiones y alternativas: búsqueda con unaccent,
perfil médico, JWT, coincidencias, generación concurrente del expediente, datos
sintéticos y fronteras entre funcionalidades. No hay pregunta técnica bloqueante
sin valor de trabajo. P-01 conserva la recomendación de §16 y P-05 no obliga a elegir
hosting para diseñar el contrato. No se ha verificado un proveedor de despliegue.

## Phase 1 — Diseño y contratos

- [data-model.md](data-model.md): entidades, validación, relaciones e invariantes.
- [contracts/openapi.json](contracts/openapi.json): API de esta funcionalidad.
- [contracts/ui.md](contracts/ui.md): rutas, interacción y estados de interfaz.
- [quickstart.md](quickstart.md): guía de ejecución y aceptación después de implementar.

El contrato de contenido clínico se mantiene como objeto de plantilla v1.1, sin
inventar ni congelar aquí su esquema completo, que pertenece a 003/VC-01.
Antes de cargar notas de demo, se necesita el esquema acordado y contenido válido.
El acceso y el registro pueden validarse previamente con historial vacío.

## Entrega y riesgos

1. Preparar PostgreSQL/unaccent, configuración y perfil médico sin integrar IA.
2. Entregar acceso y rechazo uniforme de sesiones inválidas.
3. Implementar búsqueda, coincidencias y registro con expediente generado de forma segura.
4. Entregar lectura de expediente y versiones con fixtures válidos compartidos.
5. Integrar las pantallas en `frontend/` y validar por HTTPS.
6. Implementar PATCH de ficha solo después de cumplir lo M.

El riesgo de carrera en la generación de expediente se resuelve con secuencia PostgreSQL
y restricción única, no con `max+1` sin bloqueo. La vigencia de 12 horas
sin revocación y el almacenamiento del token del MVP se documentan como límites;
no se presenta la salida local como invalidación del token en otros dispositivos.
La extensión PostgreSQL y la URL del frontend deben comprobarse en implementación.

## Complexity Tracking

Sin desviaciones que justificar. No se añaden microservicios, tenancy, refresh de
sesión ni infraestructura IA para esta funcionalidad.
