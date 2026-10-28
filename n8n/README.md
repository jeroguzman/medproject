# WF-1 — VozClínica / procesar-audio

Exportación de n8n para control de versiones. Esta copia se preparó a partir del workflow original probado y tiene la corrección `language_code` (en el export original figuraba `lenguage_code`).

## Importación en otra instancia de n8n

Importa `wf1-procesar-audio.json` y vuelve a asignar en la interfaz las credenciales **Header Auth** a tres nodos:
- `Webhook`: nombre de encabezado `X-VozClinica-Secret`.
- `ElevenLabs STT`: encabezado `xi-api-key`.
- `Backboard LLM`: encabezado `X-API-Key`.

Las credenciales, IDs de instancia y datos de ejecuciones fueron retirados deliberadamente del archivo compartido. El workflow importado estará desactivado hasta que se configure y publique.

## Contrato actual

`POST /webhook/procesar-audio`, autenticado con header `X-VozClinica-Secret`, formulario multipart: `audio` (archivo), `modo` (`dictado`/`consulta`) y `prompt` (prompt clínico de extracción generado en el backend). Devuelve `transcripcion`, `extraccion_raw` (cadena JSON) y `metricas` (duración y tiempos aproximados de etapas).

## Limitaciones antes de usar pacientes reales

- Aplicar filtros y validación completa del esquema del lado Django; los controles n8n sólo prueban una estructura mínima.
- Validar ausencia de archivo, modos desconocidos y errores de servicios; responder con errores controlados.
- Eliminar hilos temporales de Backboard y definir política de retención. Desactivar el guardado de ejecuciones con datos clínicos.
- Confirmar diarización del modo consulta (hoy el nodo ElevenLabs tiene `diarize=false`).
- Rotar el secreto del webhook que apareció en capturas y compartirlo con el backend sólo por medio seguro.
- Usar únicamente consultas ficticias para las pruebas actuales.

**Importante:** este archivo no actualiza automáticamente el workflow ya publicado en n8n. Corregir también `lenguage_code` a `language_code` en el nodo activo y volver a probar.
