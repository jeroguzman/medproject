# Especificaciones de MedVox

Derivadas de los documentos existentes, 2026-10-28. Estado: borradores revisados documentalmente.
La funcionalidad 001 tiene [plan técnico](001-acceso-pacientes/plan.md), investigación,
modelo, contratos y guía de validación. Las demás conservan su especificación.
La funcionalidad 001 tiene [45 tareas por responsable](001-acceso-pacientes/tasks.md),
separadas por miembro: [German](001-acceso-pacientes/tasks/german.md),
[Jeroben](001-acceso-pacientes/tasks/jeroben.md) y
[Luis](001-acceso-pacientes/tasks/luis.md). Las listas conservan historias,
dependencias y validaciones, con [coordinación compartida](001-acceso-pacientes/tasks/coordination.md).
El backend tiene 21 tareas de Jeroben completadas y [37 pruebas verificadas](001-acceso-pacientes/validation/jeroben.md);
la carga de notas de demo y el despliegue HTTPS siguen pendientes. Frontend y backend comparten
este repositorio, conforme a la decisión del usuario registrada en DECISIONES.md.

## Funcionalidades

| Directorio | Alcance | Prioridad |
|---|---|---|
| [001-acceso-pacientes](001-acceso-pacientes/spec.md) | Acceso del médico y gestión de pacientes | M y mejoras S/C indicadas |
| [002-captura-audio](002-captura-audio/spec.md) | Captura de audio con consentimiento | M y mejoras S/C indicadas |
| [003-extraccion-clinica](003-extraccion-clinica/spec.md) | Transcripción y prellenado clínico verificable | M y mejoras S/C indicadas |
| [004-revision-autorizacion](004-revision-autorizacion/spec.md) | Revisión del borrador y autorización de la nota | M y mejoras S/C indicadas |
| [005-correcciones-versiones](005-correcciones-versiones/spec.md) | Correcciones autorizadas e historial de versiones | M y mejoras S/C indicadas |
| [006-funciones-apoyo](006-funciones-apoyo/spec.md) | Consulta y herramientas de apoyo opcionales | S/C |

## Trazabilidad funcional

Cada RF tiene un propietario documental único; los flujos se integran mediante las dependencias descritas.
FR conserva el número de RF para facilitar la revisión.

| Requisito original | Prioridad | Especificación y requisito |
|---|---|---|
| RF-01 | M | [001-acceso-pacientes · FR-001](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-02 | M | [001-acceso-pacientes · FR-002](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-03 | M | [001-acceso-pacientes · FR-003](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-04 | M | [001-acceso-pacientes · FR-004](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-05 | M | [001-acceso-pacientes · FR-005](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-06 | M | [001-acceso-pacientes · FR-006](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-07 | M | [001-acceso-pacientes · FR-007](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-08 | S | [001-acceso-pacientes · FR-008](001-acceso-pacientes/spec.md#functional-requirements) |
| RF-09 | M | [002-captura-audio · FR-009](002-captura-audio/spec.md#functional-requirements) |
| RF-10 | M | [002-captura-audio · FR-010](002-captura-audio/spec.md#functional-requirements) |
| RF-11 | M | [002-captura-audio · FR-011](002-captura-audio/spec.md#functional-requirements) |
| RF-12 | M | [002-captura-audio · FR-012](002-captura-audio/spec.md#functional-requirements) |
| RF-13 | M | [002-captura-audio · FR-013](002-captura-audio/spec.md#functional-requirements) |
| RF-14 | S | [002-captura-audio · FR-014](002-captura-audio/spec.md#functional-requirements) |
| RF-15 | C | [002-captura-audio · FR-015](002-captura-audio/spec.md#functional-requirements) |
| RF-16 | M | [003-extraccion-clinica · FR-016](003-extraccion-clinica/spec.md#functional-requirements) |
| RF-17 | M | [003-extraccion-clinica · FR-017](003-extraccion-clinica/spec.md#functional-requirements) |
| RF-18 | M | [003-extraccion-clinica · FR-018](003-extraccion-clinica/spec.md#functional-requirements) |
| RF-19 | M | [003-extraccion-clinica · FR-019](003-extraccion-clinica/spec.md#functional-requirements) |
| RF-20 | S | [003-extraccion-clinica · FR-020](003-extraccion-clinica/spec.md#functional-requirements) |
| RF-21 | S | [003-extraccion-clinica · FR-021](003-extraccion-clinica/spec.md#functional-requirements) |
| RF-22 | M | [004-revision-autorizacion · FR-022](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-23 | M | [004-revision-autorizacion · FR-023](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-24 | M | [004-revision-autorizacion · FR-024](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-25 | M | [004-revision-autorizacion · FR-025](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-26 | M | [004-revision-autorizacion · FR-026](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-27 | S | [004-revision-autorizacion · FR-027](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-28 | S | [004-revision-autorizacion · FR-028](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-29 | M | [004-revision-autorizacion · FR-029](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-30 | M | [004-revision-autorizacion · FR-030](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-31 | M | [004-revision-autorizacion · FR-031](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-32 | M | [004-revision-autorizacion · FR-032](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-33 | M | [004-revision-autorizacion · FR-033](004-revision-autorizacion/spec.md#functional-requirements) |
| RF-34 | M | [005-correcciones-versiones · FR-034](005-correcciones-versiones/spec.md#functional-requirements) |
| RF-35 | M | [005-correcciones-versiones · FR-035](005-correcciones-versiones/spec.md#functional-requirements) |
| RF-36 | M | [005-correcciones-versiones · FR-036](005-correcciones-versiones/spec.md#functional-requirements) |
| RF-37 | C | [005-correcciones-versiones · FR-037](005-correcciones-versiones/spec.md#functional-requirements) |
| RF-38 | S | [006-funciones-apoyo · FR-038](006-funciones-apoyo/spec.md#functional-requirements) |
| RF-39 | C | [006-funciones-apoyo · FR-039](006-funciones-apoyo/spec.md#functional-requirements) |
| RF-40 | C | [006-funciones-apoyo · FR-040](006-funciones-apoyo/spec.md#functional-requirements) |
| RF-41 | C | [006-funciones-apoyo · FR-041](006-funciones-apoyo/spec.md#functional-requirements) |
| RF-42 | S | [006-funciones-apoyo · FR-042](006-funciones-apoyo/spec.md#functional-requirements) |
| RF-43 | S | [006-funciones-apoyo · FR-043](006-funciones-apoyo/spec.md#functional-requirements) |
| RF-44 | C | [006-funciones-apoyo · FR-044](006-funciones-apoyo/spec.md#functional-requirements) |

## Aceptación y calidad transversales

| Origen | Funcionalidades |
|---|---|
| CA-01 | [003-extraccion-clinica](003-extraccion-clinica/spec.md) |
| CA-02 | [003-extraccion-clinica](003-extraccion-clinica/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md) |
| CA-03 | [004-revision-autorizacion](004-revision-autorizacion/spec.md) |
| CA-04 | [003-extraccion-clinica](003-extraccion-clinica/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md) |
| CA-05 | [003-extraccion-clinica](003-extraccion-clinica/spec.md) |
| CA-06 | [004-revision-autorizacion](004-revision-autorizacion/spec.md) |
| CA-07 | [004-revision-autorizacion](004-revision-autorizacion/spec.md) |
| CA-08 | [001-acceso-pacientes](001-acceso-pacientes/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md) |
| CA-09 | [005-correcciones-versiones](005-correcciones-versiones/spec.md) |
| CA-10 | [002-captura-audio](002-captura-audio/spec.md) |
| CA-11 | [003-extraccion-clinica](003-extraccion-clinica/spec.md) |
| RNF-01 | [001-acceso-pacientes](001-acceso-pacientes/spec.md), [002-captura-audio](002-captura-audio/spec.md), [003-extraccion-clinica](003-extraccion-clinica/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md), [005-correcciones-versiones](005-correcciones-versiones/spec.md), [006-funciones-apoyo](006-funciones-apoyo/spec.md) |
| RNF-02 | [002-captura-audio](002-captura-audio/spec.md), [003-extraccion-clinica](003-extraccion-clinica/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md), [005-correcciones-versiones](005-correcciones-versiones/spec.md) |
| RNF-03 | [001-acceso-pacientes](001-acceso-pacientes/spec.md), [002-captura-audio](002-captura-audio/spec.md) |
| RNF-04 | [001-acceso-pacientes](001-acceso-pacientes/spec.md), [003-extraccion-clinica](003-extraccion-clinica/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md), [005-correcciones-versiones](005-correcciones-versiones/spec.md), [006-funciones-apoyo](006-funciones-apoyo/spec.md) |
| RNF-05 | [006-funciones-apoyo](006-funciones-apoyo/spec.md) |
| RNF-06 | [004-revision-autorizacion](004-revision-autorizacion/spec.md), [005-correcciones-versiones](005-correcciones-versiones/spec.md) |
| RNF-07 | [002-captura-audio](002-captura-audio/spec.md), [003-extraccion-clinica](003-extraccion-clinica/spec.md) |
| RNF-08 | [001-acceso-pacientes](001-acceso-pacientes/spec.md), [002-captura-audio](002-captura-audio/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md), [005-correcciones-versiones](005-correcciones-versiones/spec.md), [006-funciones-apoyo](006-funciones-apoyo/spec.md) |
| RNF-09 | [003-extraccion-clinica](003-extraccion-clinica/spec.md), [004-revision-autorizacion](004-revision-autorizacion/spec.md), [006-funciones-apoyo](006-funciones-apoyo/spec.md) |

## Continuación con Spec Kit

La funcionalidad activa es `001-acceso-pacientes`, en `.specify/feature.json`.
Para otra funcionalidad, establece `feature_directory` a su ruta `specs/NNN-nombre`
antes de ejecutar `$speckit-plan` o `$speckit-tasks`. Las especificaciones no
requieren ramas distintas. Usa el checkout existente en este entorno aislado.

Orden sugerido: 001 → 002 → 003 → 004 → 005; 006 solo después del flujo M.
Se pueden preparar ejemplos sintéticos compartidos para trabajar componentes en paralelo.
Antes de congelar contratos, revisar [DECISIONES.md](DECISIONES.md).
