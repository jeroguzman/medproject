# Decisiones provisionales y discrepancias

Fecha: 2026-10-28. Este registro no declara aprobaciones del equipo.
REQUERIMIENTOS §16 indica: «Mientras no se resuelvan, se trabaja con la recomendación».
Por eso estas cuestiones permiten avanzar con el plan, pero deben confirmarse antes
del congelamiento de contratos. Los responsables son los roles documentados, no
asignaciones nuevas en un sistema externo.

## Decisión confirmada por el usuario

**2026-10-28 — frontend en este mismo repositorio.** `frontend/` alojará React
junto a `backend/`, `ia/` y `n8n/`. Esta instrucción reemplaza la separación de
repositorios de REQUERIMIENTOS §9.6 y de las guías. Se conserva el stack previsto;
Lovable puede servir como herramienta de generación, sin imponer otro repositorio.
La constitución 1.1.0 y el plan de 001 reflejan esta decisión. Los documentos de
origen se conservan como referencia histórica; ante ese conflicto prevalece esta
decisión y no se debe solicitar la URL de un repositorio frontend separado.

## Pendientes de origen

| ID | Valor de trabajo tomado del repositorio | Impacto / responsable de confirmar |
|---|---|---|
| P-01 | Identificación del paciente y médico de solo lectura en la nota; se corrige en la ficha o cambiando paciente. Fecha, hora y tipo sí se editan (§7.2). | 001 y 004; German y Jeroben |
| P-02 | Talla en cm. | 003 y 004; Luis y German |
| P-03 | Primera vez / Seguimiento; no añadir Urgencia. | 004; equipo |
| P-04 | Motivo, padecimiento, diagnóstico con condición y plan con medicamento o medidas. Las guías añaden fecha, hora, tipo y consentimiento en Consulta. | 004 y 005; equipo, con validación idéntica en interfaz y servidor |
| P-05 | n8n Cloud y servicio administrado para Django/PostgreSQL, sin elegir proveedor definitivo. | Plan de infraestructura; Jeroben |
| P-06 | Conservar transcripción textual con la nota autorizada; nunca audio. Las guías representan también segmentos por hablante. | 003–005; equipo; confirmar si se conservan segmentos además del texto |
| P-07 | Elegir el modelo por evaluación: cero invenciones, después campos correctos y latencia. | 003; Luis; los nombres de modelos sugeridos no prueban disponibilidad |

## Discrepancias detectadas

### Distinguir transmisión de persistencia

La guía frontend §3 dice «Nada clínico sale del navegador hasta autorizar».
El flujo aprobado D-02 y §9.3 requiere enviar audio para procesamiento temporal.
Se aplica la interpretación coherente con ese flujo: no hay **persistencia** clínica
antes de autorizar; sí transmisión y procesamiento temporal. No se registra contenido
clínico en logs ni se guarda el audio en archivos temporales.

### Datos de ejecución fallida

La guía backend §12 permite guardar ejecuciones fallidas durante desarrollo;
D-02, §9.3 y la constitución exigen no conservar audio ni transcripciones.
Prevalece esa restricción: desactivar almacenamiento de ejecuciones clínicas,
tanto exitosas como fallidas. Los artefactos sintéticos del conjunto de evaluación
son fixtures de prueba, no consultas de usuarios retenidas por el procesamiento.

### Validación de la extracción

REQUERIMIENTOS §8.3 pide validar esquema, reintentar una vez y devolver error si
persiste el fallo. La guía IA §9 propone normalizar campos inválidos vaciándolos y
«nunca falla». Antes de implementar 003, concretar la frontera: respuesta global
inválida conserva el contrato de error/reintento; normalización de campos recuperables
no debe ocultar fallos ni completar datos inventados. Definir ejemplos de ambos casos
en el plan y probarlos con el esquema compartido.

### Evidencia y prioridades

RF-20 y el backlog sitúan evidencia/filtro en S, mientras §8.2–8.3 y las guías lo
describen como parte del pipeline. Se conserva S para su entrega visible y filtro
específico; CA-05 y la prohibición de inventar siguen siendo obligatorios en M.
El plan de 003 debe acordar el mínimo de verificación que satisface CA-05 sin
presentar una mejora S como criterio de entrega M no acordado.

### Exportación PDF

§9.4 propone una ruta de exportación; VC-23 y la guía frontend plantean impresión
desde el navegador. RF-42 exige el resultado PDF de la nota autorizada; la elección
del mecanismo corresponde al plan de 006, manteniendo prioridad S.

### Alerta de alergia

La guía IA describe bloqueo, y frontend admite excepción con justificación.
RF-40 solo exige la alerta. La política de excepción queda por concretar antes de
implementar la mejora C; no condiciona la autorización del MVP sin esa mejora.

## Límites de la revisión

Se revisaron requerimientos, guías y referencias aplicables. Las especificaciones
expresan comportamiento esperado; no acreditan que exista la aplicación, que una
API externa acepte los formatos candidatos ni que se haya ejecutado la evaluación.
El plan debe validar compatibilidad y disponibilidad con documentación oficial y
las integraciones reales cuando corresponda.


## Acceso con MojoAuth — decisión del usuario, 2026-10-28

El usuario seleccionó backend real para login, pacientes, historial y versiones,
y solicitó usar MojoAuth. Se prepara Email OTP como método inicial de trabajo,
con verificación en Django y JWT interno para la API. Password no será fallback
en producción. Configurar las claves y vincular correos médicos antes de desplegar.
Las pruebas de proveedor son simuladas: el acceso real permanece pendiente hasta
verificar el proyecto. Detalle en [docs/MOJOAUTH.md](../docs/MOJOAUTH.md).
