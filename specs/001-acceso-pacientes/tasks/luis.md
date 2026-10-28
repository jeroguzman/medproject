# Tareas de Luis — acceso y pacientes

**Responsable**: Luis. **Rol**: C — IA y contrato clínico compartido.
**Feature**: `001-acceso-pacientes`. **Estado**: pendientes.

En 001 tu entrega es el esquema y ejemplos de 003/VC-01 que desbloquean las notas de demo y su lectura. El pipeline IA, audios y evaluación tienen su propia especificación 003; no se añaden aquí tareas de otras funcionalidades.

Este archivo es la fuente editable de tus casillas; no edites sus copias en
[../tasks.md](../tasks.md). Conserva IDs, etiquetas de historia y prioridades.
Tras cambiar una casilla, ejecuta desde la raíz:
`python3 scripts/sync-team-tasks.py`. Consulta [coordinación](coordination.md)
para orden, contratos y criterios de cierre.

## Phase 4: User Story 2 — Encontrar y registrar al paciente correcto (P1 / M)

- [ ] T027 [US2] Entregar o reutilizar desde 003/VC-01 el contrato compartido en `ia/esquemas/formato_clinico_general_v1_1.json` y ejemplos sintéticos en `ia/esquemas/ejemplos/`, conforme a REQUERIMIENTOS §7 y la guía IA §5; validar esquema y ejemplos y coordinar con German/Jeroben claves, campos y versión. No crear un esquema reducido ni implementar aquí transcripción/LLM. Comunicar ruta, versión y resultado de validación para desbloquear T028 y T034; si la entrega sigue pendiente, mantener esta casilla abierta y registrar el bloqueo en `specs/001-acceso-pacientes/validation/luis.md`. El contrato pertenece a 003 aunque se registre como dependencia compartida de 001.
