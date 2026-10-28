# VozClínica (medproject)

Asistente de documentación clínica por voz para un hackathon de 2 días con un equipo de 3. El médico graba la consulta o dicta; la IA transcribe y prellena el Formato Clínico General; el médico revisa, corrige y autoriza. Solo la nota autorizada entra al expediente.

## Documentos de referencia

- `docs/REQUERIMIENTOS.md`: fuente de verdad. Empieza por "Contexto en 5 minutos".
- `docs/equipo/german-frontend.md`: frontend con Lovable, borrador local, formulario y autorización.
- `docs/equipo/jeroben-backend.md`: Django, **contrato de la API (§6)**, modelos, despliegue e infraestructura de n8n.
- `docs/equipo/luis-ia.md`: esquema JSON, Scribe, prompt, filtros, **interfaz de `vozclinica_ia` (§6)**, **webhook de n8n (§10)** y evaluación.
- `docs/referencias/`: plantilla original (.docx), design system v0.4 (.html) y propuesta inicial.

Antes de cambiar algo, lee la sección que le corresponde en esos documentos.

## Estructura del repositorio

```
docs/      requerimientos, guías del equipo y referencias
backend/   Django + DRF (aún no existe; ver la guía de Jeroben, §7)
ia/        paquete Python vozclinica_ia, esquemas, prompts, casos y evaluación (aún no existe; ver la guía de Luis, §6)
n8n/       workflows exportados en JSON
```
El frontend vive en el repositorio que crea Lovable, no aquí.

## Reglas que el código no puede romper

1. **Nada clínico se guarda en el servidor antes de autorizar.** `/api/ia/procesar` no escribe en la base de datos ni en el disco: las subidas solo van a memoria. El audio nunca se guarda.
2. **`VersionNota` es inmutable.** Corregir una nota es insertar una versión nueva; nunca se actualiza ni se borra una versión.
3. **Solo Django escribe en PostgreSQL.** n8n nunca escribe en la base de datos.
4. **Al LLM solo se le envía la transcripción**, nunca el nombre, el expediente ni las alergias del paciente. Esas comparaciones se hacen en los filtros, en Python.
5. **La IA no inventa.** Lo que no se dijo queda en `sin_informacion`; "negado" es un estado distinto; diagnósticos y medicamentos solo si el médico los dijo.
6. **Nada de datos clínicos en los logs**, ni cuerpos de petición, transcripciones o contenido de notas.
7. **Las claves de las APIs** van solo en variables de entorno, nunca en el repositorio ni en el frontend.
8. **Solo datos ficticios.**

## Contratos compartidos

No los cambies sin avisar al equipo y sin actualizar el documento donde están definidos:
- **Claves de los campos de la plantilla:** `docs/REQUERIMIENTOS.md` §7.2 y `docs/equipo/german-frontend.md` §8.
- **API REST:** `docs/equipo/jeroben-backend.md` §6.
- **Funciones de `vozclinica_ia` que usa Django:** `docs/equipo/luis-ia.md` §6.
- **Webhook `procesar-audio` de n8n:** `docs/equipo/luis-ia.md` §10.

## Convenciones

- Documentación, interfaz y mensajes de error en español de México, tratando de "tú" al médico.
- Los nombres del dominio van en español, igual que en los documentos (`Paciente`, `VersionNota`, `motivo_consulta`, `sin_informacion`). No los traduzcas.
- Fechas ISO en la API (`AAAA-MM-DD`, `HH:MM`, ISO 8601 con zona); el formato de pantalla (`12/mar/1992`) lo decide el frontend.
- Las tareas tienen IDs de Linear `VC-xx` (backlog en `docs/REQUERIMIENTOS.md` §13.2). Inclúyelos en el nombre de la rama o en el mensaje del commit.
- Prioridades MoSCoW: termina lo **M** antes de tocar lo S o lo C.

## Comandos

Todavía no hay código. Cuando se creen `backend/` e `ia/`, agrega aquí cómo instalar, levantar el servidor, cargar los datos de demo (`python manage.py cargar_demo`), correr las pruebas y correr la evaluación.
