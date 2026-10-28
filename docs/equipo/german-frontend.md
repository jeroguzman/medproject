# Guía de German: frontend, Linear y demo

> Rol **A** del plan ([REQUERIMIENTOS §13](../REQUERIMIENTOS.md)). Si German y Jeroben prefieren intercambiar roles, basta con cambiar los nombres aquí y en la decisión D-14.

## 1. Tu parte en una frase

Construyes con Lovable todo lo que ve el médico: desde el inicio de sesión hasta autorizar y corregir una nota, con el borrador guardado **solo en el navegador**. Además configuras Linear y coordinas los ensayos de la demo.

## 2. Tus tareas

| ID | Tarea | Prio. | Cuándo |
|---|---|---|---|
| — | Crear el equipo y el backlog en Linear (§13) | M | Día 1, primera hora |
| VC-05 | Proyecto en Lovable con los tokens del DS, layout de escritorio e inicio de sesión | M | Día 1 |
| VC-06 | Pantallas de pacientes: lista, búsqueda, registro mínimo y expediente | M | Día 1 |
| VC-07 | Pantalla de consulta: cabecera, índice de secciones y formulario completo con JSON de ejemplo | M | Día 1 |
| VC-08 | Borrador en el navegador: autoguardado, indicador y descartar | M | Día 1 |
| VC-09 | Grabadora y subida de archivo, con modos y consentimiento | M | Día 1 |
| VC-15 | Integrar "Procesar" con el borrador y las insignias de origen | M | Hito 1 |
| VC-16 | Autorizar: validación, diálogo y llamada a la API (con Jeroben) | M | Día 2 |
| VC-17 | Corrección con versiones y vista de versiones (con Jeroben) | M | Día 2 |
| VC-19 | Evidencia por campo y panel de transcripción (con Luis) | S | Día 2 |
| VC-20 | Alerta de paciente que no coincide (con Jeroben) | S | Día 2 |
| VC-21 | Validación de signos vitales e IMC | S | Día 2 |
| VC-23 | Vista de impresión de la nota autorizada (PDF desde el navegador) | S | Día 2 |
| VC-26 | Alerta de alergia contra medicamento (con Jeroben) | C | Si sobra tiempo |
| VC-27 | Guion de la demo, video de respaldo y pitch (coordinas tú) | M | Día 2 |

## 3. Reglas que no se rompen

1. **Nada clínico sale del navegador hasta autorizar** (D-02). El borrador va a `localStorage`; el audio vive en memoria y nunca se guarda en `localStorage`.
2. **La identificación es de solo lectura** (P-01): nombre, expediente, fecha de nacimiento, sexo, médico y cédula vienen de la API.
3. **Un campo vacío no es un "no"**: se muestra "— Sin información", y "negado" es un estado distinto.
4. **Corregir no sobrescribe**: cada corrección autorizada es una versión nueva.
5. **Lovable no debe usar Supabase ni Lovable Cloud.** Todo va contra la API de Django.

## 4. Con quién te coordinas

| Con | Recibes | Entregas |
|---|---|---|
| Jeroben | URL de la API, usuarios de prueba y el contrato de la API ([su guía, §6](jeroben-backend.md)) | El dominio del frontend en Lovable para CORS, lo antes posible |
| Luis | JSON de ejemplo de `/api/ia/procesar` (`ia/esquemas/ejemplos/`) en la primera hora y audios de prueba | Avisos cuando la IA llene mal un campo (con el caso y el campo) |
| Todos | — | El backlog de Linear y el guion de la demo |

Mientras la API no esté lista, trabajas con los datos de ejemplo (§12).

## 5. Plan por hitos

**Día 1, primera hora**
- [ ] Crear el equipo y el backlog en Linear (§13).
- [ ] Revisar con Jeroben y Luis el contrato de API y el esquema: desde ese momento quedan congelados.
- [ ] Prompts 1 y 2 de Lovable (§6): base del proyecto y design system.
- [ ] Mandarle a Jeroben el dominio de Lovable.

**Día 1, resto del día**
- [ ] Prompts 3 a 7: inicio de sesión, pacientes, consulta, borrador y grabadora, con datos de ejemplo.
- [ ] Cambiar pacientes e inicio de sesión a la API real en cuanto Jeroben la despliegue.
- [ ] **Hito 1:** subir un audio de prueba → `/api/ia/procesar` → formulario lleno en pantalla.

**Día 2, mañana**
- [ ] Prompts 8 y 9: autorizar, ver la nota, versiones y corregir.
- [ ] **Hito 2 (mediodía):** todo lo M funcionando contra el backend desplegado.

**Día 2, tarde**
- [ ] S: evidencia, panel de transcripción, alertas, signos vitales y vista de impresión.
- [ ] Unas 3 h antes de la entrega: congelar el código, ensayar la demo 2 o 3 veces y grabar el video de respaldo.

## 6. Prompts para Lovable

> **Actualización:** usa el paquete de [`lovable/README.md`](lovable/README.md). Tiene estos mismos pasos con el detalle exacto de la app de referencia (`frontend/`), las capturas que hay que adjuntar a cada prompt, el conocimiento del proyecto para Lovable, los prompts de Backboard, Tavily y Linear, y el backlog de Linear en CSV. Los prompts de abajo quedan como resumen.

Pega un prompt a la vez y revisa el resultado antes del siguiente. Lovable guarda cada cambio en su repositorio de GitHub. Conéctalo al inicio; un nombre sugerido es `medproject-frontend`.

**Prompt 1: base del proyecto**
```text
Crea una aplicación web llamada MedVox con React, TypeScript, Vite, Tailwind, shadcn/ui, lucide-react, react-router y TanStack Query.
IMPORTANTE: no uses Supabase, ni Lovable Cloud, ni ningún backend propio. Todos los datos vienen de una API REST externa.
- Crea src/config.ts con API_URL (string) y USAR_MOCKS (boolean).
- Crea src/api/cliente.ts: un fetch que antepone API_URL, agrega "Authorization: Bearer <token>" (token guardado en localStorage con la clave "medvox:token"), convierte errores HTTP en excepciones con el JSON { error: { codigo, mensaje } } y redirige a /login si recibe 401.
- Si USAR_MOCKS es true, el cliente responde con los archivos JSON de src/mocks/ en lugar de llamar a la red.
- Toda la interfaz va en español de México, tratando de "tú" al usuario. Se diseña primero para escritorio de 1366 × 768.
- Muestra siempre una etiqueta pequeña y fija con el texto "Datos ficticios".
```

**Prompt 2: design system**
```text
Aplica el design system que te doy abajo.
- Guarda las variables CSS en src/styles/tokens.css e impórtalo en index.css.
- Mapea las variables de shadcn a estos tokens, convirtiendo los colores al formato que use la configuración de shadcn del proyecto:
  --background → --color-bg; --card y --popover → --color-surface; --foreground → --color-text;
  --muted-foreground → --color-text-muted; --primary → --color-action; --primary-foreground → --color-action-fg;
  --destructive → --color-critical-solid; --border → --color-border; --input → --color-border-input;
  --ring → --color-focus; --radius → 8px.
- Tipografía: "Atkinson Hyperlegible Next" para el texto y "Atkinson Hyperlegible Mono" para expedientes y códigos, desde Google Fonts.
- Texto base de 16 px; ningún dato clínico por debajo de 14 px. Rejilla de 4 px. Radios de 8 px en campos y botones y de 12 px en tarjetas. Controles de 40 px de alto.
- Reglas: un solo botón primario por pantalla; el rojo solo para lo crítico (alergias, errores, acciones destructivas); todo estado se comunica con color, icono y palabra juntos; foco visible de 3 px con --color-focus.
- Iconos de lucide-react en 16, 20 y 24 px.
[Pega aquí el bloque :root y los dos bloques de modo oscuro de docs/referencias/design-system-clinico-v0.4.html, líneas 14 a 130]
```

**Prompt 3: inicio de sesión y layout**
```text
- Pantalla /login con usuario, contraseña y el botón "Iniciar sesión". Permite pegar y usar gestores de contraseñas. Llama a POST /api/auth/login, que responde { access, medico }, y guarda access como token.
- Rutas protegidas: sin token, redirige a /login.
- Layout autenticado: barra superior de 48 px con "MedVox", el nombre del médico (GET /api/auth/me) y "Cerrar sesión". Navegación lateral con "Pacientes".
- En la pantalla de consulta, la navegación se reduce a un riel de 88 px con icono y etiqueta.
- Al cerrar sesión, si existe alguna clave de localStorage que empiece con "medvox:borrador:" o "medvox:correccion:", pregunta antes con un diálogo: "Tienes un borrador sin autorizar. Si cierras sesión se pierde." con los botones "Seguir trabajando" y "Descartar y salir".
```

**Prompt 4: pacientes y expediente**
```text
- /pacientes: buscador por nombre, expediente o fecha de nacimiento (GET /api/pacientes?q=). Tabla con Paciente (formato "APELLIDOS, Nombre(s)"), sexo, edad, expediente en fuente mono y fecha de la última consulta.
- Botón "Registrar paciente" que abre un formulario: Nombre(s)*, Apellido paterno*, Apellido materno, Fecha de nacimiento* (formato DD/mmm/AAAA, mostrando la edad calculada), Sexo* (control segmentado: Mujer / Hombre / No especificado), Alergias* (texto, con un botón "Sin alergias conocidas") y Teléfono. Mientras se escribe el nombre o la fecha, muestra las coincidencias en una alerta: "Posible paciente ya registrado", con los botones "Abrir expediente" y "No es ninguno: registrar nuevo". Guarda con POST /api/pacientes.
- /pacientes/:id: cabecera de paciente con fondo --color-banner-bg y texto --color-banner-fg: iniciales, "APELLIDOS, Nombre(s)", sexo, edad, expediente, fecha de nacimiento y tipo de sangre. Las alergias van en una cápsula roja clara (--color-banner-alert-bg); "Sin alergias conocidas" va en neutro.
- Debajo, el historial cronológico (GET /api/pacientes/:id/notas): fecha, diagnóstico principal, médico e insignia de estado ("Autorizada" o "Corregida · v2"). Cada renglón abre /notas/:id.
- Botón primario "Nueva consulta" que lleva a /pacientes/:id/consulta.
```

**Prompt 5: pantalla de consulta y formulario**
```text
Pantalla /pacientes/:id/consulta:
- Arriba, la cabecera de paciente, siempre visible.
- Barra de la consulta con fecha, hora (24 h) y tipo de consulta (control segmentado: Primera vez / Seguimiento; propone "Seguimiento" si el paciente ya tiene notas). A la derecha, la insignia punteada "Borrador · solo en este equipo · no está en el expediente".
- Tres columnas: a la izquierda el índice de secciones; al centro el formulario (máximo 960 px); a la derecha un panel de 360 px con pestañas "Transcripción" e "Historial".
- El formulario se genera desde src/plantilla/formatoClinicoGeneral.ts (te paso el archivo). Tipos de campo:
  texto y textoLargo: textarea con contador.
  antecedente: textarea más un control segmentado Referido / Negado / Sin información.
  vital: número con la unidad dentro del campo a la derecha, inputmode="decimal", y un selector Medido / Referido.
  presion: dos números con "/" entre ellos; al escribir "/" el foco pasa a la diastólica.
  imc: solo lectura, calculado con peso y talla en cm.
  diagnosticos: lista de renglones con descripción y condición (Confirmado / Presuntivo / Por determinar), con "Agregar diagnóstico" y quitar.
  medicamentos: lista de renglones con medicamento, dosis, vía, frecuencia y duración, con "Agregar medicamento" y quitar.
- Cada campo muestra su etiqueta, el valor y una insignia de origen: "IA" (informativa, azul) o "Editado" (neutra). Un campo vacío muestra "— Sin información" en gris; nunca parece normal.
- Las secciones se recorren en cualquier orden. Ctrl+Enter pasa a la siguiente. La sección 09 "Revisión y autorización" es un resumen, no un formulario.
- Por ahora carga los datos de src/mocks/procesar_faringitis.json para ver el formulario lleno.
```
Junto con este prompt pega el archivo de la §8.

**Prompt 6: borrador en el navegador**
```text
Implementa el borrador local de la consulta con estas reglas exactas:
- Clave de localStorage: "medvox:borrador:<pacienteId>". Un borrador por paciente.
- Estructura: { version_formato: 1, paciente_id, plantilla: { clave: "formato_clinico_general", version: "1.1" }, identificacion: { fecha_consulta, hora_atencion, tipo_consulta }, modo_captura, consentimiento_grabacion, secciones, transcripcion: { texto, segmentos }, alertas, alertas_resueltas, actualizado_en }.
- Se guarda 500 ms después de cada cambio y se vuelve a cargar al abrir la pantalla.
- El audio NUNCA se guarda en localStorage.
- Al editar un campo: si su origen era "ia", pasa a "editado"; si estaba vacío, pasa a "manual". Si se borra un valor de la IA, queda { valor: null, estado: "sin_informacion", origen: "editado" }.
- Botón "Descartar borrador" con diálogo: título "¿Descartar el borrador?", cuerpo "Se borra todo lo capturado en esta consulta. No se puede deshacer.", botones "Seguir editando" y "Descartar borrador" (este último en rojo).
- Si el usuario intenta cerrar la pestaña con un borrador, muestra el aviso del navegador (beforeunload).
```

**Prompt 7: grabadora**
```text
En la parte superior del formulario de consulta, agrega el componente Grabadora:
- Selector de modo: Dictado / Consulta.
- En modo Consulta, la casilla "El paciente autorizó la grabación" es obligatoria: sin ella, Grabar y Subir archivo quedan deshabilitados y el botón explica por qué.
- Grabar con MediaRecorder (usa "audio/webm;codecs=opus" si MediaRecorder.isTypeSupported lo acepta). Botones Grabar, Pausar, Reanudar y Detener; tiempo transcurrido mm:ss; medidor de nivel con AnalyserNode. Se detiene sola a los 20:00. Al detener, libera el micrófono.
- "Subir archivo" (accept="audio/*,.mp3,.m4a,.wav,.webm"): máximo 50 MB y 20 minutos.
- El audio se guarda solo en memoria (useRef). Estados: Lista · Grabando · Pausada · Audio listo (con reproductor y "Volver a grabar") · Procesando · Error con "Reintentar".
- Si el navegador niega el micrófono, muestra una alerta que explique cómo permitirlo.
- Botón primario "Procesar audio": envía multipart a POST /api/ia/procesar con audio, paciente_id y modo. Espera hasta 180 s (AbortController). Mientras espera muestra el tiempo transcurrido y estos mensajes por tiempo: 0–15 s "Transcribiendo el audio…", después "Llenando el formato…".
- Al terminar, descarta el audio de la memoria y fusiona la respuesta con el borrador según las reglas que te doy.
```
Pega también las reglas de fusión de la §9.

**Prompt 8: autorizar**
```text
Sección 09 "Revisión y autorización":
- Resumen: campos llenados por la IA sin cambios, editados, manuales, vacíos y alertas abiertas.
- Campos obligatorios: motivo_consulta, padecimiento_actual, al menos un diagnóstico con descripción y condición, y al menos un medicamento o un valor en medidas_seguimiento. También fecha, hora y tipo de consulta.
- El botón primario "Autorizar nota" se deshabilita si falta algo o si hay una alerta que bloquea. Debajo dice qué falta ("Falta: Diagnóstico") y al pulsarlo lleva al campo.
- Diálogo de confirmación. Título: "¿Autorizar la nota?". Cuerpo: "La nota se guardará en el expediente de <APELLIDOS, Nombre(s)> (Exp. <expediente>). Podrás corregirla después; cada corrección queda registrada como una versión nueva. La IA llenó <n> campos que no cambiaste: al autorizar confirmas que los revisaste." Botones: "Seguir editando" y "Autorizar nota".
- Al confirmar, llama a POST /api/notas con { paciente_id, plantilla, fecha_consulta, hora_atencion, tipo_consulta, modo_captura, consentimiento_grabacion, contenido: secciones, transcripcion }.
- Con 201: borra la clave del borrador, muestra el aviso "Nota autorizada · <fecha> · <hora>" y lleva a /notas/:id.
- Con 400: muestra la lista "faltantes" de la respuesta y lleva al primer campo.
```

**Prompt 9: ver nota, versiones y corregir**
```text
- /notas/:id (GET /api/notas/:id): cabecera de paciente, insignia de estado y la versión vigente del formato completo en solo lectura. Panel de versiones con número, fecha, autor y motivo; al elegir una versión anterior se muestra en solo lectura con el aviso "Versión anterior · no vigente".
- Botón "Corregir" que abre /notas/:id/corregir: copia de trabajo guardada en localStorage con la clave "medvox:correccion:<notaId>", con la insignia "Corrección sin autorizar". Mismo formulario y mismas reglas de origen.
- "Autorizar corrección" pide en el diálogo el campo obligatorio "Motivo del cambio" y llama a POST /api/notas/:id/versiones con { contenido, motivo_cambio, version_base }.
- Con 201: borra la copia de trabajo y vuelve a /notas/:id. Con 409: "La nota cambió mientras la corregías. Recarga para ver la versión vigente."
- Botón "Imprimir" que abre /notas/:id/imprimir: diseño parecido a la plantilla en papel, sin navegación, y llama a window.print().
```

## 7. Pantallas y rutas

| Ruta | Pantalla | Prio. |
|---|---|---|
| `/login` | Inicio de sesión | M |
| `/pacientes` | Lista, búsqueda y registro | M |
| `/pacientes/:id` | Expediente: cabecera e historial | M |
| `/pacientes/:id/consulta` | Grabadora, formulario y panel derecho | M |
| `/notas/:id` | Nota autorizada y versiones | M |
| `/notas/:id/corregir` | Copia de trabajo de una corrección | M |
| `/notas/:id/imprimir` | Vista de impresión | S |

## 8. Configuración del formulario

Guárdalo como `src/plantilla/formatoClinicoGeneral.ts`. Las claves coinciden con el esquema de Luis y con REQUERIMIENTOS §7.2; no las cambies sin avisar a los dos.

```ts
export type TipoCampo =
  | "texto" | "textoLargo" | "antecedente" | "vital" | "presion"
  | "imc" | "diagnosticos" | "medicamentos";

export interface CampoConfig {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  unidad?: string;
  obligatorio?: boolean;
  ayuda?: string;
}

export interface GrupoConfig { clave: string; titulo?: string; campos: CampoConfig[] }
export interface SeccionConfig { id: string; numero: string; titulo: string; grupos: GrupoConfig[] }

export const FORMATO_CLINICO_GENERAL: SeccionConfig[] = [
  { id: "motivo", numero: "02", titulo: "Motivo y padecimiento actual", grupos: [
    { clave: "motivo_padecimiento", campos: [
      { clave: "motivo_consulta", etiqueta: "Motivo de consulta", tipo: "texto", obligatorio: true,
        ayuda: "De preferencia en palabras del paciente" },
      { clave: "padecimiento_actual", etiqueta: "Padecimiento actual", tipo: "textoLargo", obligatorio: true,
        ayuda: "Inicio, duración, evolución, síntomas relevantes y tratamientos previos" },
    ] },
  ] },
  { id: "antecedentes", numero: "03", titulo: "Antecedentes", grupos: [
    { clave: "antecedentes", campos: [
      { clave: "heredofamiliares", etiqueta: "Heredofamiliares", tipo: "antecedente" },
      { clave: "personales_patologicos", etiqueta: "Personales patológicos", tipo: "antecedente" },
      { clave: "personales_no_patologicos", etiqueta: "Personales no patológicos (hábitos y exposiciones)", tipo: "antecedente" },
      { clave: "alergias", etiqueta: "Alergias / reacciones", tipo: "antecedente" },
      { clave: "medicamentos_actuales", etiqueta: "Medicamentos actuales y tratamientos previos", tipo: "antecedente" },
    ] },
  ] },
  { id: "interrogatorio", numero: "04", titulo: "Interrogatorio por aparatos y sistemas", grupos: [
    { clave: "interrogatorio", campos: [
      { clave: "aparatos_sistemas", etiqueta: "Datos positivos y negativos relevantes", tipo: "textoLargo",
        ayuda: "Documentar solo lo informado o explorado" },
    ] },
  ] },
  { id: "exploracion", numero: "05", titulo: "Signos vitales y exploración física", grupos: [
    { clave: "signos_vitales", titulo: "Signos vitales", campos: [
      { clave: "presion_arterial", etiqueta: "Presión arterial", tipo: "presion", unidad: "mmHg" },
      { clave: "frecuencia_cardiaca", etiqueta: "Frecuencia cardiaca", tipo: "vital", unidad: "lpm" },
      { clave: "frecuencia_respiratoria", etiqueta: "Frecuencia respiratoria", tipo: "vital", unidad: "rpm" },
      { clave: "temperatura", etiqueta: "Temperatura", tipo: "vital", unidad: "°C" },
      { clave: "saturacion_o2", etiqueta: "Saturación de oxígeno", tipo: "vital", unidad: "%" },
      { clave: "peso", etiqueta: "Peso", tipo: "vital", unidad: "kg" },
      { clave: "talla", etiqueta: "Talla", tipo: "vital", unidad: "cm" },
      { clave: "imc", etiqueta: "IMC", tipo: "imc", unidad: "kg/m²" },
      { clave: "otros_parametros", etiqueta: "Otros parámetros", tipo: "texto" },
    ] },
    { clave: "exploracion_fisica", titulo: "Exploración física", campos: [
      { clave: "habitus_exterior", etiqueta: "Habitus exterior / estado general", tipo: "texto" },
      { clave: "cabeza_cuello", etiqueta: "Cabeza y cuello", tipo: "texto" },
      { clave: "torax_cardiopulmonar", etiqueta: "Tórax y aparato cardiopulmonar", tipo: "texto" },
      { clave: "abdomen", etiqueta: "Abdomen", tipo: "texto" },
      { clave: "extremidades_otros", etiqueta: "Extremidades y otros hallazgos", tipo: "texto" },
      { clave: "genitourinario_otros", etiqueta: "Genitourinario u otras áreas", tipo: "texto" },
    ] },
  ] },
  { id: "estudios", numero: "06", titulo: "Estudios y resultados relevantes", grupos: [
    { clave: "estudios", campos: [
      { clave: "estudios_resultados", etiqueta: "Laboratorio, gabinete u otros", tipo: "textoLargo",
        ayuda: "Resultado, fecha y origen" },
    ] },
  ] },
  { id: "valoracion", numero: "07", titulo: "Valoración clínica", grupos: [
    { clave: "valoracion", campos: [
      { clave: "diagnosticos", etiqueta: "Diagnósticos o problemas clínicos", tipo: "diagnosticos", obligatorio: true },
      { clave: "pronostico", etiqueta: "Pronóstico documentado por el médico", tipo: "texto" },
    ] },
  ] },
  { id: "plan", numero: "08", titulo: "Plan, tratamiento y seguimiento", grupos: [
    { clave: "plan", campos: [
      { clave: "medicamentos", etiqueta: "Medicamentos", tipo: "medicamentos" },
      { clave: "medidas_seguimiento", etiqueta: "Medidas no farmacológicas, estudios solicitados, referencia y seguimiento",
        tipo: "textoLargo" },
    ] },
  ] },
  { id: "revision", numero: "09", titulo: "Revisión y autorización", grupos: [] },
];
```

Forma de los valores (detalle en la [guía de Luis, §5](luis-ia.md)):
- **Texto y antecedente:** `{ valor: string | null, estado: "referido" | "negado" | "sin_informacion", evidencia: string[] | null, origen? }`.
- **Vital:** `{ valor: number | null, unidad, estado: "medido" | "referido" | "sin_informacion", evidencia, origen? }`.
- **Presión:** igual que vital, con `valor: { sistolica, diastolica } | null`.
- **Diagnóstico** (renglón): `{ descripcion, condicion: "confirmado" | "presuntivo" | "por_determinar", evidencia, origen? }`.
- **Medicamento** (renglón): `{ medicamento, dosis, via, frecuencia, duracion, evidencia, origen? }`.
- **El IMC no se guarda:** se calcula al mostrarlo.

## 9. Fusión de la respuesta de la IA con el borrador

`/api/ia/procesar` responde `{ transcripcion, borrador, alertas, metricas }` ([guía de Jeroben, §6](jeroben-backend.md)). Reglas para fusionar:

1. **Primer audio** (borrador vacío): copia `borrador.secciones` y pon `origen: "ia"` en cada campo o renglón con `estado` distinto de `sin_informacion`.
2. **Audios siguientes** (S, RF-14): copia un campo de la IA **solo si el del borrador está en `sin_informacion` y no tiene origen**. En las listas, agrega los renglones nuevos sin tocar los que ya existen. Nunca sobrescribas nada.
3. **Transcripción:** agrega los segmentos nuevos a `transcripcion.segmentos` con `audio: n` (1, 2, …) y concatena el texto.
4. **Alertas:** reemplaza las del audio anterior por las nuevas, pero conserva `alertas_resueltas`.
5. **Modo de captura:** `modo_captura = "consulta"` si cualquier audio fue de consulta; si no, `"dictado"`. El consentimiento se guarda como `true` si se marcó.

## 10. Alertas

Cada alerta trae `{ tipo, severidad, campo, mensaje, bloquea }`.

| `tipo` | Cómo se muestra | ¿Bloquea autorizar? |
|---|---|---|
| `paciente_no_coincide` | Alerta crítica fija sobre el formulario, con los botones "Es el paciente correcto" (la marca como resuelta) y "Cambiar paciente" | Sí, hasta resolverla |
| `valor_imposible` | Error rojo junto al campo, con el mensaje que diga cómo corregirlo | Sí, hasta corregir el valor |
| `fuera_de_rango` | Advertencia ámbar junto al campo: "Se guardará marcado en la nota" | No |
| `sin_evidencia` | Aviso informativo junto al campo: "La IA propuso un valor sin respaldo en el audio y se descartó" | No |
| `unidad_convertida` | Aviso informativo: "Talla convertida de metros a centímetros" | No |
| `alergia_medicamento` (C) | Alerta crítica en el renglón del medicamento (DS 7.5) | Sí, salvo justificación |

**Evidencia (S):** al enfocar un campo de la IA o pasar el cursor encima, muestra las citas en un popover con el botón "Ver en la transcripción", que desplaza el panel derecho y resalta la cita con `--color-highlight`. En modo Consulta, cada segmento muestra "Médico" o "Paciente" según `segmentos[].rol`.

## 11. Formatos (DS §11)

Crea `src/lib/formatos.ts`:
- `formatearFecha("1992-03-12")` → `"12/mar/1992"`. Meses: ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic.
- `formatearFechaCita(...)` → `"mar 03/nov/2026"`, si llegan a usarse fechas de cita.
- `formatearEdad(fechaNacimiento, fechaReferencia)`: años; meses si tiene menos de 2 años; días si tiene menos de 1 mes.
- `nombreCabecera(p)` → `"GARCÍA LÓPEZ, María Fernanda"`.
- Hora siempre en formato de 24 h. Punto decimal. La unidad siempre aparece con la cifra.

**Ojo:** `new Date("1992-03-12")` se interpreta en UTC y en México muestra el 11 de marzo. Separa la fecha en año, mes y día y crea la fecha local con `new Date(a, m - 1, d)`.

## 12. Modo de datos de ejemplo

Con `USAR_MOCKS = true`, el cliente lee los archivos de `src/mocks/`:
- `login.json`, `me.json`, `pacientes.json` (los mismos pacientes que precarga Jeroben, [su guía, §9](jeroben-backend.md)), `paciente_1.json`, `notas_paciente_1.json`, `nota_12.json`.
- `procesar_faringitis.json`: cópialo de `ia/esquemas/ejemplos/` en cuanto Luis lo suba. Mientras tanto, usa el ejemplo de REQUERIMIENTOS §7.4.

Cuando la API esté lista, cambia a `USAR_MOCKS = false` pantalla por pantalla.

## 13. Linear (primera hora)

1. Crea el equipo **MedVox** con la clave **`VC`**, para que los issues se numeren VC-1, VC-2… igual que el backlog.
2. Crea los issues **en el orden** de REQUERIMIENTOS §13.2 para que coincidan los números.
3. Etiquetas: `frontend`, `backend`, `ia`, `demo`. Prioridades: M → Alta, S → Media, C → Baja.
4. Asigna cada tarea según la columna "Resp." (A = German, B = Jeroben, C = Luis).
5. Crea un ciclo de 2 días con todo lo M.
6. Conecta GitHub en Linear. Si las ramas o los PR mencionan el ID (por ejemplo `VC-7`), el issue se mueve solo.

## 14. Cuándo está terminado lo tuyo

- [ ] CA-01: con un audio de prueba, el formato aparece lleno y cada campo muestra su origen.
- [ ] CA-03: al recargar la página, el borrador sigue ahí.
- [ ] CA-04: "Negado" y "— Sin información" se ven distintos.
- [ ] CA-06: no se puede autorizar con obligatorios vacíos, y el botón dice qué falta.
- [ ] CA-07: tras autorizar, la nota aparece en el historial y el borrador desaparece.
- [ ] CA-09: corregir crea la versión 2 y la versión 1 se puede consultar.
- [ ] CA-10: en modo Consulta no se puede grabar sin marcar el consentimiento.
- [ ] CA-11 (S): la alerta de paciente que no coincide bloquea autorizar.

## 15. Trampas comunes

- **Lovable propone Supabase o Lovable Cloud:** recházalo y repite "solo API REST externa".
- **Errores de CORS:** pásale a Jeroben el dominio exacto de Lovable, el de vista previa y el publicado.
- **El micrófono no funciona:** requiere HTTPS; la vista previa de Lovable ya lo es.
- **El audio no cabe en `localStorage`** (unos 5 MB): por eso vive solo en memoria.
- **Lovable reescribe archivos:** revisa que `formatoClinicoGeneral.ts` y `formatos.ts` no cambien sin querer. Lovable guarda cada cambio en GitHub, así que puedes revertir.
- **El procesamiento tarda:** usa audios cortos en la demo (2 o 3 min). El timeout del frontend es de 180 s.
