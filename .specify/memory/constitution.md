<!-- Sync Impact Report
Version: 1.0.0 → 1.1.0.
Restricción técnica actualizada por instrucción explícita del usuario:
frontend React en frontend/ dentro de medproject, junto a backend/, ia/ y n8n/.
No cambian principios clínicos. Sin pendientes de sincronización del diseño de 001.
-->
# Constitución de MedVox

## Core Principles

### I. Alcance trazable
Cada especificación debe referenciar los RF, RNF y CA aplicables de
`docs/REQUERIMIENTOS.md` y respetar sus prioridades M/S/C/W.
Los indispensables preceden a las mejoras; los W quedan fuera del MVP.
Los requerimientos prevalecen sobre la propuesta inicial y sobre las partes
contradictorias del design system, según las decisiones explícitas del MVP.

### II. Autorización médica y versiones
El paciente se elige antes de grabar. El borrador permanece en el navegador;
no se persisten borradores ni audio en el servidor. Solo la autorización explícita
incorpora la nota al expediente. Toda corrección requiere nueva autorización y
motivo, y crea una versión nueva sin modificar las anteriores.
La interfaz dice «Autorizar»: el MVP no ofrece firma electrónica.

### III. Privacidad y límites de la IA
Desarrollo y demo usan datos ficticios y audios sintéticos. El audio no se almacena;
n8n debe desactivar la persistencia de ejecuciones. Al LLM se envía la transcripción
sin añadir los datos identificativos del paciente. Las credenciales no se incluyen
en el repositorio. La IA prellena para revisión médica y nunca autoriza por sí sola.

### IV. Contratos compartidos
El Formato Clínico General v1.1 se representa como esquema JSON versionado.
Django valida el esquema y aplica filtros con `ia/medvox_ia`; n8n orquesta.
Los cambios de API y esquema deben mantener alineados los consumidores y las guías
 del equipo. Los datos ausentes no se inventan para completar campos.

### V. Evidencia de aceptación
Cada historia debe incluir criterios verificables y pruebas proporcionales al riesgo.
Se valida con datos sintéticos el flujo audio → prellenado → revisión → autorización
→ expediente, la ausencia de persistencia previa a autorización, la asociación con
el paciente correcto y la conservación de versiones. Los resultados simulados
se distinguen de las integraciones reales.

## Restricciones técnicas

Se respeta el stack acordado: React en `frontend/` dentro de este mismo repositorio, Django con DRF,
PostgreSQL, ElevenLabs Scribe v2, Backboard y n8n. La distribución de componentes
sigue §9.6 de los requerimientos, con la decisión explícita del usuario de alojar
el frontend también en medproject. Lovable, si se usa, es una herramienta de generación,
no un requisito de repositorio separado. La interfaz usa español de México y el Design
System Clínico v0.4 con las adaptaciones del MVP; se valida WCAG 2.2 AA en los
flujos implementados.

## Flujo de trabajo

Se usa Spec Kit: especificación, aclaraciones necesarias, plan, tareas, análisis,
implementación y validación. Cada plan comprueba esta constitución. Las decisiones
pendientes se registran sin inventar acuerdos. Las especificaciones detallan las
funcionalidades sin reemplazar silenciosamente la documentación vigente.

## Governance

Las enmiendas requieren propuesta documentada y revisión del equipo. Toda revisión
de implementación comprueba los principios y criterios aplicables. Los conflictos
con acuerdos vigentes se resuelven explícitamente antes de implementar el cambio.
Se usa versionado semántico: major para cambios incompatibles de principios,
minor para nuevas reglas y patch para aclaraciones.

**Version**: 1.1.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
