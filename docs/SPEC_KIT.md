# Spec Kit en VozClínica

Inicializado con Specify CLI 1.2.4, integración Codex en modo skills y scripts Bash.
Los archivos `.specify/` y `.agents/skills/` forman parte del proyecto.

## Fuentes

- Alcance: [REQUERIMIENTOS.md](REQUERIMIENTOS.md).
- Principios: [constitución](../.specify/memory/constitution.md).
- Contratos y responsabilidades: guías de [equipo/](equipo/).

## Uso en Codex

Abre Codex desde la raíz. Si la sesión estaba abierta durante la instalación,
inicia una nueva para que descubra las skills locales. Ejecuta en el chat,
uno por vez, revisando cada resultado:

1. `$speckit-specify` con la funcionalidad y los identificadores de requisitos.
2. `$speckit-clarify` para resolver decisiones pendientes de esa funcionalidad.
3. `$speckit-plan` respetando el stack y los contratos documentados.
4. `$speckit-tasks` para desglosar la implementación.
5. `$speckit-analyze` para revisar consistencia.
6. `$speckit-implement` y `$speckit-converge` para implementar y validar.

Usa `$speckit-constitution` para enmendar principios. Las seis especificaciones y
su trazabilidad están en [specs/README.md](../specs/README.md). Las decisiones
provisionales se conservan en [specs/DECISIONES.md](../specs/DECISIONES.md).
La funcionalidad activa para el próximo plan es `001-acceso-pacientes`.
Para cambiarla, actualiza `feature_directory` en `.specify/feature.json` a la
ruta de la funcionalidad elegida antes de invocar los comandos siguientes.

## Tareas por miembro del equipo

Para 001, cada miembro mantiene sus casillas en `specs/001-acceso-pacientes/tasks/`:
`german.md` (frontend e integración), `jeroben.md` (backend e infraestructura) y
`luis.md` (esquema clínico compartido). `coordination.md` conserva dependencias y
entregas entre miembros. Las futuras listas deben identificar responsables según
las guías del equipo y conservar esta separación.

`tasks.md` es la vista consolidada para Spec Kit. Después de actualizar las listas:

```bash
python3 scripts/sync-team-tasks.py
python3 scripts/sync-team-tasks.py --check
```

Al implementar, actualiza la casilla en el archivo del responsable y regenera;
no marques únicamente la copia consolidada. El script cubre la funcionalidad 001.
Si se vuelve a generar `$speckit-tasks`, conserva las listas individuales y el
reparto acordado antes de regenerar la vista.

## CLI en este entorno

```bash
export PATH="/workspace/.tools/bin:$PATH"
specify version
specify check
```

En otra máquina con Python 3.11+ y uv: `uv tool install specify-cli==1.2.4`.
Un clon ya incluye plantillas y skills; no repitas `specify init --force` sobre
archivos personalizados. El CLI no instala las dependencias de la aplicación.
