# Feature Specification: Acceso del médico y gestión de pacientes

**Feature Branch**: `work` (rama existente compartida; no se crean ramas automáticamente).

**Feature Directory**: `specs/001-acceso-pacientes`

**Created**: 2026-10-28

**Status**: Implementación parcial; adenda MojoAuth solicitada por el usuario, pendiente de validación con su proyecto.

**Input**: Crear especificaciones con los documentos del repositorio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceder como médico (Priority: P1)

Como médico, quiero acceder como médico para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Permite operar con la identidad profesional correcta.

**Independent Test**: Iniciar y cerrar sesión con un médico ficticio, y repetir con credenciales inválidas. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** credenciales válidas, **When** el médico inicia sesión, **Then** ve su nombre, cédula y especialidad y puede consultar pacientes.
2. **Given** una sesión ausente o inválida, **When** se intenta consultar información clínica o autorizar una nota, **Then** se rechaza la operación sin modificar información.
3. **Given** un borrador sin autorizar, **When** el médico solicita cerrar sesión, **Then** se le avisa antes de continuar y puede cancelar la salida.

### User Story 2 - Encontrar y registrar al paciente correcto (Priority: P1)

Como médico, quiero encontrar y registrar al paciente correcto para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: La consulta necesita un paciente elegido antes de capturar.

**Independent Test**: Buscar con y sin acentos, registrar un paciente y abrir su expediente. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** los 6 a 8 pacientes de demo, **When** se busca por nombre, expediente o fecha de nacimiento, **Then** aparecen las coincidencias; los acentos no alteran la búsqueda por nombre.
2. **Given** datos mínimos completos, **When** se solicita registrar un paciente, **Then** se muestran posibles duplicados antes de confirmar y se asigna un expediente único.
3. **Given** un paciente con notas previas, **When** se abre el expediente, **Then** la cabecera identifica al paciente y el historial muestra notas autorizadas con fecha, diagnóstico, estado y versión.

### User Story 3 - Corregir la ficha del paciente (Priority: P2)

Como médico, quiero corregir la ficha del paciente para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Mejora S; evita corregir la identificación dentro de una nota.

**Independent Test**: Editar la ficha de un paciente ficticio y comprobar su identificación actualizada. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** la ficha abierta, **When** el médico cambia datos de identificación, **Then** los cambios quedan en la ficha del paciente y no se editan directamente dentro de la nota.

### Edge Cases

- Una búsqueda sin coincidencias muestra un estado vacío y permite iniciar el registro.
- El registro incompleto no crea pacientes; el apellido materno es opcional y la ausencia de alergias se expresa explícitamente.
- Una nota previa y sus versiones se consultan en solo lectura; la corrección usa 005.

## Requirements *(mandatory)*

### Functional Requirements

P1 agrupa M; P2 agrupa S; P3 agrupa C. Esta prioridad no transforma mejoras S/C en obligaciones M.

- **FR-001** (M; RF-01): Permitir acceso del médico autorizado mediante MojoAuth en producción y mostrar nombre, cédula y especialidad. La decisión explícita del usuario sustituye la contraseña de RF-01 para el despliegue; password se conserva solo como modo de desarrollo explícito. Ver [adenda](contracts/mojoauth.md).
- **FR-002** (M; RF-02): Permitir cerrar sesión y advertir antes si existe un borrador sin autorizar.
- **FR-003** (M; RF-03): Buscar pacientes por nombre sin distinguir acentos, expediente o fecha de nacimiento.
- **FR-004** (M; RF-04): Registrar nombre, apellido paterno, apellido materno opcional, fecha de nacimiento, sexo y alergias; mostrar coincidencias antes de confirmar y asignar expediente único. Escribir explícitamente Sin alergias conocidas cuando corresponda.
- **FR-005** (M; RF-05): Proporcionar de 6 a 8 pacientes ficticios, algunos con notas previas y uno con alergia a penicilina.
- **FR-006** (M; RF-06): Mostrar cabecera e historial cronológico de notas autorizadas con fecha, diagnóstico principal, estado y versión.
- **FR-007** (M; RF-07): Mostrar una nota autorizada completa y sus versiones anteriores en solo lectura.
- **FR-008** (S; RF-08): Permitir editar la ficha de identificación del paciente en un único lugar.

### Quality & Privacy Requirements

- **RNF-01**: Usar solo datos ficticios y mostrar la etiqueta Datos ficticios.
- **RNF-03**: Proteger el transporte de información y restringir los orígenes de acceso al frontend autorizado.
- **RNF-04**: Exigir autenticación en las operaciones clínicas; proteger las integraciones y no exponer credenciales al usuario.
- **RNF-08**: Interfaz en español de México, tratamiento de tú y accesibilidad WCAG 2.2 AA; los estados no dependen solo del color.

### Key Entities

Médico: identidad profesional y sesión. Paciente: expediente único, identificación y alergias. Resumen de nota: fecha, diagnóstico, estado y versión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con las credenciales de demo se completa acceso → búsqueda → expediente; las credenciales inválidas se rechazan.
- **SC-002**: Existen entre 6 y 8 pacientes ficticios, algunos con notas previas y al menos uno con alergia a penicilina.
- **SC-003**: Las búsquedas de prueba por nombre con y sin acentos devuelven los mismos pacientes.
- **SC-004**: Ninguna operación clínica de la prueba sin sesión válida permite acceso o escritura.

## Assumptions

- Un solo rol médico; escritorio, Chrome/Edge recientes y conexión a internet. Datos de demo ficticios.
- Dependencias: Ninguna funcionalidad previa; usa datos ficticios precargados. El historial recibe notas de 004 y 005.
- Decisiones y verificaciones: P-01 Véase [registro transversal](../DECISIONES.md). Según §16 se trabaja con las recomendaciones mientras no se resuelvan.
- Las reglas detalladas de campos de §7.2–7.3 son el inventario de aceptación de la plantilla; no se reduce el formato a los ejemplos de esta especificación.
- Fuera de alcance: agenda, citas, firma electrónica, otros roles, FHIR, plantillas por especialidad, sincronización sin conexión y coordinación de varias pestañas.

## Sources & Traceability

- Fuente normativa: [REQUERIMIENTOS](../../docs/REQUERIMIENTOS.md), §§6–12 y §16; prevalece sobre la propuesta inicial.
- Detalle de interacción: [guía frontend](../../docs/equipo/german-frontend.md).
- Contratos y reglas de guardado: [guía backend](../../docs/equipo/jeroben-backend.md).
- Esquema, extracción y evaluación: [guía IA](../../docs/equipo/luis-ia.md).
- [Design System v0.4](../../docs/referencias/design-system-clinico-v0.4.html), con adaptaciones de §10.2; plantilla v1.1 según §7.
- Backlog relacionado (referencia, no tareas generadas): VC-02 a VC-06.
- Aceptación de origen: CA-08.
