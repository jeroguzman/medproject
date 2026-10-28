# Guía de Luis: IA (transcripción, extracción, filtros y evaluación)

> Rol **C** del plan ([REQUERIMIENTOS §13](../REQUERIMIENTOS.md)).

## 1. Tu parte en una frase

Haces que un audio se convierta en un borrador del Formato Clínico General **sin inventar nada**, y lo demuestras con números. Te encargas del esquema, la transcripción con ElevenLabs, el prompt en Backboard, los filtros en Python, los workflows de n8n y la evaluación.

**No entrenes ni hospedes modelos.** En 2 días no da tiempo y no mejora la demo. Scribe v2 y un LLM vía Backboard resuelven el problema. Lo que distingue al proyecto es la **calidad** que logres con el esquema, el prompt, los filtros y la evaluación.

## 2. Tus tareas

| ID | Tarea | Prio. | Cuándo |
|---|---|---|---|
| VC-01 | Esquema JSON v1.1 y `procesar_faringitis.json` de ejemplo para German | M | Día 1, **primera hora** |
| VC-10 | Probar Scribe con audio real en español: diarización, números y keyterms | M | Día 1 |
| VC-11 | Guiones de 5 o 6 casos, audios con TTS y JSON esperado | M | Día 1 (caso 01) → día 2 (los demás) |
| VC-12 | Prompt de extracción v1 en Backboard | M | Día 1 |
| — | Paquete `ia/medvox_ia` con esquema, extracción, filtros y pipeline (§6) | M | Día 1 |
| VC-13 | Workflow WF-1 `procesar-audio` en n8n (Jeroben prepara las credenciales) | M | Día 1 → hito 1 |
| VC-18 | Script de evaluación y comparación de modelos; prompt v2 | S | Día 2 |
| VC-19 | Evidencia por campo: lado de la IA, y apoyo a German con el panel | S | Día 2 |
| VC-22 | WF-2 `nota-autorizada` y WF-5 `preguntar-expediente` con la memoria de Backboard | S | Día 2 |
| VC-25 | WF-3 `referencias` con Tavily | C | Si sobra tiempo |
| — | WF-4 `reportar-error` hacia Linear | C | Si sobra tiempo |
| VC-27 | Tabla de resultados de la evaluación para el pitch | M | Día 2 |

## 3. Reglas que no se rompen y coordinación

1. **Solo lo que está en el audio.** Si no se dijo, el campo queda en `sin_informacion`.
2. **Negado ≠ sin información.**
3. **La IA no diagnostica ni prescribe.** Diagnósticos y medicamentos solo se llenan si el médico los dijo.
4. **Al LLM solo le llega la transcripción** (D-13): nada de nombre, expediente ni alergias del paciente. Las comparaciones las hacen los filtros.
5. **Extracción sin memoria:** en Backboard, cada procesamiento usa un hilo nuevo con la memoria apagada, para que no se mezclen pacientes.
6. **Solo datos ficticios.** Los audios son de guiones escritos por el equipo.

| Con | Recibes | Entregas |
|---|---|---|
| German | Avisos de campos mal llenados | `ia/esquemas/ejemplos/procesar_faringitis.json` en la primera hora, audios de prueba y la tabla para el pitch |
| Jeroben | Cuenta y credenciales de n8n, URL y secreto del webhook, backend desplegado | El paquete `medvox_ia` (§6), el contrato del webhook (§10) y los workflows exportados en `n8n/` |

**Las claves de los campos son un contrato.** Están en REQUERIMIENTOS §7.2 y en la [guía de German](german-frontend.md), §8. No las cambies sin avisar a los dos.

## 4. Plan por hitos

**Día 1, primera hora**
- [ ] VC-01: el esquema (§5) y `procesar_faringitis.json` (puedes partir de REQUERIMIENTOS §7.4 y completar los campos). German lo necesita para avanzar.
- [ ] Leer la referencia de la API de speech-to-text de ElevenLabs y la de docs.backboard.io: parámetros, autenticación y si hay salida JSON. Unos 30 min.

**Día 1, resto del día**
- [ ] Caso 01 (§11): guion, audio con TTS y una grabación real leída por el equipo.
- [ ] VC-10: transcribir el caso 01 con Scribe y guardar `transcripcion.json`.
- [ ] VC-12: prompt v1 (§8) y `pipeline.py` funcionando desde Python con el caso 01.
- [ ] `filtros.py` (§9).
- [ ] VC-13: WF-1 en n8n (§10) y exportarlo a `n8n/wf1-procesar-audio.json`.
- [ ] **Hito 1:** audio → n8n → Django → formulario lleno en pantalla.

**Día 2**
- [ ] Casos 02 a 05, con su `esperado.json`.
- [ ] VC-18: evaluación (§12), comparación de 2 o 3 modelos y prompt v2. Fijar el modelo (P-07).
- [ ] S: WF-2 y WF-5 (§13). C: Tavily y Linear.
- [ ] Entregarle a German la tabla de resultados para el pitch.

## 5. Esquema JSON

Archivo: `ia/esquemas/formato_clinico_general_v1_1.json` (JSON Schema 2020-12). El mismo esquema valida el borrador que sale de los filtros y el `contenido` que Jeroben guarda al autorizar.

**Forma de cada tipo de campo**
- **Texto:** `{ valor: string | null, estado: "referido" | "negado" | "sin_informacion", evidencia: string[] | null, origen? }`. En campos de texto, `referido` significa que hay información documentada, la haya dicho el paciente o la haya encontrado el médico.
- **Vital:** `{ valor: number | null, unidad?, estado: "medido" | "referido" | "sin_informacion", evidencia, origen? }`. Aquí `referido` significa que lo contó el paciente y no se midió.
- **Presión:** igual que vital, con `valor: { sistolica: integer, diastolica: integer } | null`.
- **Diagnóstico** (renglón): `{ descripcion, condicion: "confirmado" | "presuntivo" | "por_determinar", cie10?: string | null, evidencia, origen? }`.
- **Medicamento** (renglón): `{ medicamento, dosis: string | null, via: string | null, frecuencia: string | null, duracion: string | null, evidencia, origen? }`.
- `origen` (`ia` | `editado` | `manual`) lo pone el frontend; el LLM no lo genera.

**Secciones y campos** (REQUERIMIENTOS §7.2)

| Sección | Campos |
|---|---|
| `motivo_padecimiento` | `motivo_consulta`, `padecimiento_actual` (texto) |
| `antecedentes` | `heredofamiliares`, `personales_patologicos`, `personales_no_patologicos`, `alergias`, `medicamentos_actuales` (texto) |
| `interrogatorio` | `aparatos_sistemas` (texto) |
| `signos_vitales` | `presion_arterial` (presión); `frecuencia_cardiaca`, `frecuencia_respiratoria`, `temperatura`, `saturacion_o2`, `peso`, `talla` (vital); `otros_parametros` (texto). El IMC no se guarda |
| `exploracion_fisica` | `habitus_exterior`, `cabeza_cuello`, `torax_cardiopulmonar`, `abdomen`, `extremidades_otros`, `genitourinario_otros` (texto) |
| `estudios` | `estudios_resultados` (texto) |
| `valoracion` | `diagnosticos` (lista), `pronostico` (texto) |
| `plan` | `medicamentos` (lista), `medidas_seguimiento` (texto) |

**Esqueleto**
```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "formato_clinico_general/1.1",
  "type": "object",
  "required": ["plantilla", "version", "secciones"],
  "properties": {
    "plantilla": { "const": "formato_clinico_general" },
    "version": { "const": "1.1" },
    "modo_captura": { "enum": ["dictado", "consulta"] },
    "paciente_mencionado": { "type": ["string", "null"] },
    "hablantes": {
      "type": "object",
      "additionalProperties": { "enum": ["medico", "paciente", "acompanante", "desconocido"] }
    },
    "secciones": {
      "type": "object",
      "additionalProperties": false,
      "required": ["motivo_padecimiento", "antecedentes", "interrogatorio", "signos_vitales",
                   "exploracion_fisica", "estudios", "valoracion", "plan"],
      "properties": {
        "motivo_padecimiento": {
          "type": "object",
          "additionalProperties": false,
          "required": ["motivo_consulta", "padecimiento_actual"],
          "properties": {
            "motivo_consulta": { "$ref": "#/$defs/campoTexto" },
            "padecimiento_actual": { "$ref": "#/$defs/campoTexto" }
          }
        },
        "signos_vitales": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "presion_arterial": { "$ref": "#/$defs/campoPresion" },
            "temperatura": { "$ref": "#/$defs/campoVital" }
            // … los demás signos y otros_parametros (campoTexto)
          }
        },
        "valoracion": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "diagnosticos": { "type": "array", "items": { "$ref": "#/$defs/diagnostico" } },
            "pronostico": { "$ref": "#/$defs/campoTexto" }
          }
        }
        // … el resto de las secciones siguen el mismo patrón
      }
    }
  },
  "$defs": {
    "evidencia": { "type": ["array", "null"], "items": { "type": "string", "minLength": 3 } },
    "origen": { "enum": ["ia", "editado", "manual"] },
    "campoTexto": {
      "type": "object", "additionalProperties": false, "required": ["valor", "estado"],
      "properties": {
        "valor": { "type": ["string", "null"] },
        "estado": { "enum": ["referido", "negado", "sin_informacion"] },
        "evidencia": { "$ref": "#/$defs/evidencia" },
        "origen": { "$ref": "#/$defs/origen" }
      }
    },
    "campoVital": {
      "type": "object", "additionalProperties": false, "required": ["valor", "estado"],
      "properties": {
        "valor": { "type": ["number", "null"] },
        "unidad": { "type": "string" },
        "estado": { "enum": ["medido", "referido", "sin_informacion"] },
        "evidencia": { "$ref": "#/$defs/evidencia" },
        "origen": { "$ref": "#/$defs/origen" }
      }
    },
    "campoPresion": {
      // igual que campoVital, pero valor es null o { sistolica, diastolica } con enteros
    },
    "diagnostico": {
      "type": "object", "additionalProperties": false, "required": ["descripcion", "condicion"],
      "properties": {
        "descripcion": { "type": "string", "minLength": 2 },
        "condicion": { "enum": ["confirmado", "presuntivo", "por_determinar"] },
        "cie10": { "type": ["string", "null"] },
        "evidencia": { "$ref": "#/$defs/evidencia" },
        "origen": { "$ref": "#/$defs/origen" }
      }
    },
    "medicamento": {
      // medicamento (obligatorio), dosis, via, frecuencia, duracion (string o null), evidencia, origen
    }
  }
}
```
El archivo real tiene que ser JSON puro, sin comentarios. Pon todos los campos como `required` en su sección: el LLM puede omitirlos, pero `filtros.normalizar` los completa antes de validar.

## 6. Paquete `ia/` e interfaz con Django

```
ia/
  requirements.txt            # jsonschema, rapidfuzz, requests (lo instala el backend)
  requirements-dev.txt        # pydub y lo que use la evaluación (el backend no lo necesita)
  medvox_ia/
    __init__.py
    esquema.py
    stt.py
    extraccion.py
    filtros.py
    pipeline.py
    memoria.py                # S
  esquemas/
    formato_clinico_general_v1_1.json
    ejemplos/procesar_faringitis.json
  prompts/extraccion_v1.md
  keyterms.json
  rangos_vitales.json
  casos/caso_01_faringitis/   # guion.md, caso.json, audio.mp3, audio_real.webm, transcripcion.json, esperado.json
  evaluacion/evaluar.py
  evaluacion/resultados/
n8n/                          # en la raíz del repo: workflows exportados
```

Django importa el paquete añadiendo `ia/` al `sys.path` ([guía de Jeroben, §7](jeroben-backend.md)). **Estas firmas son el contrato con Jeroben:**

```python
# esquema.py
def cargar() -> dict: ...                         # el JSON Schema
def validar(datos: dict) -> list[str]: ...        # errores legibles; lista vacía si es válido
def contenido_vacio() -> dict: ...                # todas las secciones con sin_informacion / listas vacías

# extraccion.py
def prompt_sistema(modo: str) -> str: ...         # prompts/extraccion_vN.md con el modo y el esquema insertados
def keyterms() -> list[str]: ...                  # keyterms.json
def parsear(raw: str) -> dict: ...                # extrae el objeto JSON del texto del LLM; lanza ErrorIA si no hay

# filtros.py
def aplicar(borrador: dict, transcripcion: dict, paciente: dict, modo: str) -> tuple[dict, list[dict]]: ...
#   paciente = {"nombres", "apellido_paterno", "apellido_materno", "fecha_nacimiento", "alergias"}
#   Devuelve (borrador_normalizado, alertas) y además completa segmentos[].rol en `transcripcion`.
#   Nunca falla por un campo mal formado: lo vacía.

# stt.py
def transcribir(audio: bytes, nombre_archivo: str, modo: str) -> dict: ...   # {"texto", "segmentos"}
def formatear_para_llm(transcripcion: dict) -> str: ...                     # "HABLANTE_1: …\nHABLANTE_2: …"

# pipeline.py (plan C de Django y evaluación)
def transcribir_y_extraer(audio: bytes, nombre_archivo: str, modo: str) -> tuple[dict, dict, dict]: ...
#   (transcripcion, borrador_crudo, metricas). Reintenta el LLM una vez si no devuelve JSON.

class ErrorIA(Exception): ...                    # Django la convierte en 502 ia_fallo
```

Variables de entorno que lee el paquete (solo en el modo `django` y en la evaluación): `ELEVENLABS_API_KEY`, `BACKBOARD_API_KEY` e `IA_MODELO`.

## 7. Transcripción con Scribe v2

Confirma en la referencia oficial los nombres exactos de los parámetros. Lo que esperamos usar:
- `POST https://api.elevenlabs.io/v1/speech-to-text` con el encabezado `xi-api-key`, en multipart.
- `file`: el audio. `model_id`: `scribe_v2`. `language_code`: español (revisa si espera `es` o `spa`).
- `diarize`: `true` solo en modo Consulta. Opcionalmente `num_speakers` (2, o 3 si hay acompañante).
- `tag_audio_events`: `false`.
- `keyterms`: la lista de `keyterms.json` (revisa el formato que acepta y si tiene costo extra).

Se espera que la respuesta traiga `text` y `words[]` con `text`, `start`, `end`, `type` (`word` | `spacing` | `audio_event`) y `speaker_id`. Esta función los agrupa en segmentos por hablante (en n8n va en un nodo Code; la misma lógica va en Python en `stt.py`):

```js
const stt = $input.first().json;
const modo = $('Webhook').first().json.body.modo;
const segmentos = [];
const etiquetas = {};
for (const w of stt.words ?? []) {
  if (w.type === 'audio_event') continue;
  const ultimo = segmentos[segmentos.length - 1];
  if (w.type === 'spacing') {
    if (ultimo) ultimo.texto += w.text;
    continue;
  }
  const id = modo === 'consulta' ? (w.speaker_id ?? 'speaker_0') : 'speaker_0';
  if (!(id in etiquetas)) etiquetas[id] = `HABLANTE_${Object.keys(etiquetas).length + 1}`;
  const hablante = etiquetas[id];
  if (ultimo && ultimo.hablante === hablante) {
    ultimo.texto += w.text;
    ultimo.fin = w.end ?? ultimo.fin;
  } else {
    segmentos.push({ hablante, texto: w.text, inicio: w.start, fin: w.end });
  }
}
for (const s of segmentos) s.texto = s.texto.trim();
const texto = segmentos.map(s => s.texto).join(' ');
const paraLlm = segmentos.map(s => `${s.hablante}: ${s.texto}`).join('\n');
return [{ json: { transcripcion: { texto, segmentos }, transcripcion_para_llm: paraLlm } }];
```

**`keyterms.json`:** de 100 a 200 términos. Medicamentos comunes en México (paracetamol, ibuprofeno, naproxeno, amoxicilina, ampicilina, metformina, glibenclamida, insulina glargina, losartán, enalapril, amlodipino, omeprazol, loratadina, salbutamol, ceftriaxona, trimetoprima con sulfametoxazol…) y términos clínicos (odinofagia, rinorrea, disnea, cefalea, mialgias, artralgias, hiperémica, adenomegalias, Lasègue, glucosa capilar, hemoglobina glucosilada…).

**Qué revisar en VC-10:** que la diarización separe bien médico y paciente; cómo salen los números ("148" o "ciento cuarenta y ocho"); cómo salen los nombres de medicamentos con y sin keyterms; y cuánto tarda con 2 y con 5 min de audio.

## 8. Prompt de extracción

Archivo: `ia/prompts/extraccion_v1.md`. Cada versión nueva va en un archivo nuevo (`v2`, `v3`…) y la evaluación registra cuál se usó. Parámetros sugeridos: temperatura 0, salida JSON si Backboard lo permite, y al menos 4 000 tokens de salida para que el JSON no se corte.

**Mensaje de sistema (v1)**
```text
Eres un asistente de documentación clínica. Llenas el Formato Clínico General v1.1 a partir de la transcripción de una consulta en español de México.

MODO: {modo}
- dictado: solo habla el médico.
- consulta: conversación entre médico y paciente, a veces con un acompañante. Cada línea empieza con la etiqueta del hablante (HABLANTE_1, HABLANTE_2…).

REGLAS
1. Usa solo información dicha en la transcripción. No infieras, no completes con conocimiento médico, no sugieras diagnósticos ni tratamientos.
2. Puedes redactar en lenguaje técnico-médico ("dolor de garganta" → "odinofagia") siempre que no agregues información.
3. Si algo se niega ("no tengo alergias", "niega tos"), registra el campo con estado "negado". Si un tema no se mencionó, NO incluyas ese campo.
4. En campos de texto, estado "referido" significa que hay información documentada.
5. Diagnósticos, pronóstico y medicamentos: inclúyelos solo si el médico los dijo. Si el médico expresa duda ("parece", "probablemente"), la condición es "presuntivo"; si dice que falta confirmar, "por_determinar"; "confirmado" solo si lo afirma. No agregues calificativos que no se dijeron (por ejemplo, "aguda").
6. En cada medicamento, deja en null la dosis, la vía, la frecuencia o la duración que no se hayan dicho.
7. No conviertas fechas relativas ("desde el lunes" se queda así). No calcules edades ni duraciones.
8. Signos vitales: en "valor" va el número, sin unidad. Unidades del formato: mmHg, lpm, rpm, °C, %, kg, cm. La talla siempre en cm (1.62 m → 162). Estado "medido" si el médico lo midió o lo dictó, "referido" si lo cuenta el paciente.
9. Formatos: punto decimal; dosis con cero inicial y sin cero final ("0.5 mg", "5 mg"); "unidades" y "mcg" con letra; frecuencias como "cada 8 h".
10. Cada campo y cada renglón lleva "evidencia": una o más citas copiadas EXACTAMENTE de la transcripción, sin la etiqueta del hablante, sin puntos suspensivos y con los números tal como aparecen.
11. En modo consulta, indica en "hablantes" qué etiqueta corresponde al médico, al paciente y, si hay, al acompañante. Lo que dice el paciente va a motivo, padecimiento, antecedentes e interrogatorio; lo que dice o mide el médico va a signos vitales, exploración, valoración y plan. En dictado, HABLANTE_1 es el médico.
12. Motivo de consulta: de preferencia, con las palabras del paciente.
13. No llenes la identificación del paciente ni la del médico. Si se menciona el nombre del paciente, cópialo en "paciente_mencionado"; si no, null.
14. Responde SOLO con un objeto JSON con las claves "paciente_mencionado", "hablantes" y "secciones". Sin texto antes ni después.

CAMPOS POSIBLES
{lista_de_campos}

EJEMPLO
Transcripción:
HABLANTE_1: Paciente que acude por dolor en tobillo izquierdo desde hace dos días, tras torcedura jugando fútbol. Niega fiebre. Tensión arterial ciento veinte sobre ochenta. Tobillo izquierdo con aumento de volumen en región lateral, sin deformidad. Probable esguince de tobillo izquierdo. Naproxeno doscientos cincuenta miligramos cada doce horas por tres días, reposo y hielo local.

Salida:
{"paciente_mencionado": null,
 "hablantes": {"HABLANTE_1": "medico"},
 "secciones": {
  "motivo_padecimiento": {
   "motivo_consulta": {"valor": "Dolor en tobillo izquierdo", "estado": "referido", "evidencia": ["acude por dolor en tobillo izquierdo desde hace dos días"]},
   "padecimiento_actual": {"valor": "Dolor en tobillo izquierdo desde hace dos días, posterior a torcedura jugando fútbol.", "estado": "referido", "evidencia": ["dolor en tobillo izquierdo desde hace dos días, tras torcedura jugando fútbol"]}},
  "interrogatorio": {"aparatos_sistemas": {"valor": "Niega fiebre.", "estado": "negado", "evidencia": ["Niega fiebre"]}},
  "signos_vitales": {"presion_arterial": {"valor": {"sistolica": 120, "diastolica": 80}, "unidad": "mmHg", "estado": "medido", "evidencia": ["Tensión arterial ciento veinte sobre ochenta"]}},
  "exploracion_fisica": {"extremidades_otros": {"valor": "Tobillo izquierdo con aumento de volumen en región lateral, sin deformidad.", "estado": "referido", "evidencia": ["Tobillo izquierdo con aumento de volumen en región lateral, sin deformidad"]}},
  "valoracion": {"diagnosticos": [{"descripcion": "Esguince de tobillo izquierdo", "condicion": "presuntivo", "evidencia": ["Probable esguince de tobillo izquierdo"]}]},
  "plan": {
   "medicamentos": [{"medicamento": "Naproxeno", "dosis": "250 mg", "via": null, "frecuencia": "cada 12 h", "duracion": "3 días", "evidencia": ["Naproxeno doscientos cincuenta miligramos cada doce horas por tres días"]}],
   "medidas_seguimiento": {"valor": "Reposo y hielo local.", "estado": "referido", "evidencia": ["reposo y hielo local"]}}}}
```
`{lista_de_campos}` es una lista compacta generada desde el esquema (sección → campo → tipo → unidad). Suele funcionar mejor que pegar el JSON Schema completo. El ejemplo es de propósito distinto a los casos de evaluación, para no inflar los resultados. Fíjate en que la vía del naproxeno queda en `null` porque no se dijo.

**Mensaje del usuario:** `TRANSCRIPCIÓN:\n{transcripcion_para_llm}`

**Modelo (P-07):** empieza con Claude Sonnet 5.5 si está en el catálogo de Backboard, por su equilibrio entre calidad y velocidad. Compáralo con Claude Haiku 5.5 (más rápido) y con un modelo de otro proveedor. Gana el que tenga 0 datos inventados; si hay empate, el de más campos correctos y, después, el de menor latencia.

## 9. Filtros (`filtros.aplicar`)

Se aplican en este orden. Todo es código determinista, sin IA:

1. **Normalizar:** quita las claves desconocidas y cualquier dato de identificación. Completa los campos que falten con `{ valor: null, estado: "sin_informacion", evidencia: null }` y las listas que falten con `[]`. Si un campo no cumple su definición, lo vacía; nunca falla.
2. **Evidencia:** normaliza la transcripción y cada cita (minúsculas, sin acentos, sin puntuación, espacios simples). Si la cita está contenida en la transcripción, es válida; si no, prueba `rapidfuzz.fuzz.partial_ratio` y acepta a partir de **85** (ajusta el umbral con la evaluación). Si un campo no tiene ninguna cita válida o no tiene evidencia, se vacía y se agrega la alerta `sin_evidencia` (`info`, no bloquea).
3. **Unidades:** si la talla es menor que 3, multiplícala por 100 y agrega la alerta `unidad_convertida` (`info`).
4. **Rangos** (`rangos_vitales.json`, de ejemplo y sin validación clínica, DS D6):

   | Signo | Imposible (`valor_imposible`, error, bloquea) | Referencia de adulto (`fuera_de_rango`, advertencia) |
   |---|---|---|
   | TA sistólica | < 50 o > 300 mmHg | 90–139 |
   | TA diastólica | < 20 o > 200 mmHg, o ≥ sistólica | 60–89 |
   | Frecuencia cardiaca | < 20 o > 250 lpm | 60–100 |
   | Frecuencia respiratoria | < 4 o > 70 rpm | 12–20 |
   | Temperatura | < 30 o > 45 °C | 36.0–37.5 |
   | Saturación O₂ | < 50 o > 100 % | ≥ 95 (por debajo de 90, severidad `critica`) |
   | Peso | < 0.5 o > 400 kg | — |
   | Talla | < 25 o > 250 cm | — |

   En menores de 18 años (según `fecha_nacimiento`) solo se aplican los límites de "imposible".
5. **Paciente mencionado:** compara `paciente_mencionado` con "nombres apellido_paterno apellido_materno" usando `fuzz.token_set_ratio` sin acentos. Por debajo de 70 → alerta `paciente_no_coincide` (`critica`, bloquea). Si es `null`, no hace nada.
6. (C) **Alergia contra medicamento:** un mapa corto de grupos (penicilinas: penicilina, amoxicilina, ampicilina, dicloxacilina; sulfas: sulfametoxazol, trimetoprima con sulfametoxazol; AINE: ibuprofeno, naproxeno, diclofenaco, ketorolaco). Si un medicamento del plan es del grupo de una alergia registrada → `alergia_medicamento` (`critica`, bloquea).
7. **Roles:** completa `transcripcion.segmentos[].rol` con `hablantes` (`desconocido` si falta). En dictado, todo es `medico`.

Forma de cada alerta: `{ "tipo", "severidad": "critica" | "advertencia" | "info", "campo": "seccion.campo" | "seccion.lista[i]" | null, "mensaje", "bloquea" }`. Los mensajes dicen qué pasó y cómo corregirlo, por ejemplo: "38.4 °C fuera de rango (36.0–37.5 °C). Se guardará marcado en la nota."

## 10. Workflow WF-1 `procesar-audio` en n8n

**Contrato con Django** (Jeroben lo llama así; no lo cambies sin avisar):

Petición: `POST {N8N_BASE_URL}/webhook/procesar-audio`, encabezado `X-MedVox-Secret`, en multipart:

| Campo | Contenido |
|---|---|
| `audio` | Archivo |
| `modo` | `dictado` \| `consulta` |
| `prompt` | Mensaje de sistema ya armado (`extraccion.prompt_sistema(modo)`) |
| `keyterms` | Lista en JSON (texto) |

Respuesta 200:
```json
{
  "transcripcion": { "texto": "…", "segmentos": [ { "hablante": "HABLANTE_1", "texto": "…", "inicio": 0.0, "fin": 3.8 } ] },
  "extraccion_raw": "{\"paciente_mencionado\": …}",
  "metricas": { "duracion_audio_s": 184.2, "ms_transcripcion": 8200, "ms_extraccion": 17400 }
}
```
Error: 502 con `{ "error": { "codigo": "stt_fallo" | "llm_fallo" | "llm_sin_json", "mensaje": "…" } }`. Django agrega `ms_total` y aplica los filtros.

**Nodos**
1. **Webhook:** POST, ruta `procesar-audio`, autenticación Header Auth (credencial `MedVox webhook`) y respuesta "Using 'Respond to Webhook' Node". En la primera ejecución revisa cómo se llama la propiedad binaria del audio y úsala en el nodo siguiente.
2. **Code "Marcar inicio":** `return [{ json: { t0: Date.now() } }]`.
3. **HTTP Request "ElevenLabs STT":** con los parámetros de la §7. `diarize` = `{{ $('Webhook').first().json.body.modo === 'consulta' }}`. Timeout de 120 s. "On Error: Continue (using error output)" hacia la respuesta 502.
4. **Code "Formatear segmentos":** la función de la §7, y además `ms_transcripcion = Date.now() - $('Marcar inicio').first().json.t0`.
5. **HTTP Request "Backboard LLM":** según docs.backboard.io, con un **hilo nuevo y la memoria apagada**, el sistema = `{{ $('Webhook').first().json.body.prompt }}`, el usuario = `TRANSCRIPCIÓN:\n` + `transcripcion_para_llm`, temperatura 0 y el modelo elegido.
6. **Code "Revisar JSON":** intenta `JSON.parse` sobre el texto del modelo (quitando cercos de código si los hay). Si falla, sigue por la rama de reintento: otra llamada a Backboard con el mensaje "Tu respuesta anterior no era JSON válido. Responde solo el objeto JSON." Si vuelve a fallar → 502 `llm_sin_json`.
7. **Respond to Webhook:** el JSON del contrato.

**Ajustes:** el workflow tiene que estar **activo** (la URL `/webhook-test/` solo funciona con el editor abierto). En la demo, sin guardar ejecuciones exitosas. Exporta el workflow a `n8n/wf1-procesar-audio.json` cada vez que lo cambies; la exportación no incluye las claves.

**Si Backboard complica la extracción:** usa un nodo LLM nativo de n8n con un proveedor directo y deja Backboard para la memoria (§13). Avísale a Jeroben para el plan C.

## 11. Casos de prueba y audios sintéticos

Cada caso vive en `ia/casos/caso_NN_nombre/`:
- `guion.md`: líneas `MÉDICO: …`, `PACIENTE: …` y `ACOMPAÑANTE: …`.
- `caso.json`: `{ paciente_id, paciente: {…}, modo, notas }`. El paciente tiene que coincidir con los datos de demo ([guía de Jeroben, §9](jeroben-backend.md)).
- `audio.mp3` (TTS) y, si se puede, `audio_real.webm`: uno de ustedes lee el guion con el micrófono de una laptop, porque el TTS es demasiado limpio.
- `transcripcion.json`: caché de Scribe para no volver a pagar la transcripción en cada ajuste del prompt.
- `esperado.json`: el borrador normalizado escrito a mano.

**Casos**

| Caso | Paciente | Modo | Qué pone a prueba |
|---|---|---|---|
| 01 faringitis (**el de la demo**) | GARCÍA LÓPEZ, María Fernanda | Consulta | Alergia referida, temperatura fuera de rango, heredofamiliares no mencionados, diagnóstico presuntivo |
| 02 hipertensión | RAMÍREZ SOTO, Jorge | Consulta | "Niega cefalea y dolor torácico" (negado), medicamento actual, plan sin medicamento nuevo |
| 03 diabetes | CASTILLO VEGA, Rosa Elena (+ hija) | Consulta, 3 voces | Diarización con acompañante, glucosa capilar en "otros parámetros", talla dicha en metros, antecedente heredofamiliar, estudio solicitado |
| 04 lumbalgia | TORRES MEDINA, Luis Alberto | Dictado | Un solo hablante, Lasègue negativo, vía oral dicha |
| 05 trampa | Se procesa con HERNÁNDEZ RUIZ, Ana Sofía | Dictado | Menciona a "Juan Pérez" (debe saltar `paciente_no_coincide`); **no hay diagnóstico ni medicamentos**: las listas deben quedar vacías |
| 06 pediatría (opcional) | HERNÁNDEZ RUIZ, Ana Sofía (+ mamá) | Consulta | FC de 100 lpm sin alerta de adulto |

**Guion del caso 01**
```text
MÉDICO: Buenos días, pásele. ¿Usted es María Fernanda García?
PACIENTE: Sí, doctora, buenos días.
MÉDICO: Cuénteme, ¿qué la trae por aquí?
PACIENTE: Me duele mucho la garganta y tengo calentura desde el lunes.
MÉDICO: ¿Ha tenido tos o escurrimiento de la nariz?
PACIENTE: Tos no, nada más un poquito de moco.
MÉDICO: ¿Tomó algo?
PACIENTE: Me tomé paracetamol de quinientos cada ocho horas y sí me bajó un poco.
MÉDICO: ¿Es alérgica a algún medicamento?
PACIENTE: Sí, a la penicilina, me salen ronchas.
MÉDICO: Muy bien, vamos a revisarla. Trae treinta y ocho punto cuatro de temperatura. La presión está en ciento cuarenta y ocho sobre noventa y dos. Frecuencia cardiaca de ochenta y ocho por minuto. Saturación de noventa y siete por ciento.
MÉDICO: Abra la boca, por favor. Las amígdalas están hipertróficas y enrojecidas, sin placas. En el cuello hay ganglios pequeños, dolorosos. Pulmones bien ventilados, sin ruidos agregados.
MÉDICO: Parece una faringitis, probablemente viral. Le voy a dejar paracetamol de quinientos cada ocho horas por tres días, mucho líquido y reposo. Si en cuarenta y ocho horas sigue con fiebre o le cuesta tragar, regresa.
PACIENTE: Gracias, doctora.
```
Escribe los números con letra para ver cómo los normaliza Scribe. En los demás guiones, incluye muletillas y frases sueltas, como en una consulta real.

**Generar audio** (`ia/casos/generar_audio.py`): asigna una voz por rol (elige en la Voice Library voces con acento mexicano).
- **Opción A:** el endpoint de diálogo con varias voces (*Text to Dialogue*), si está en su plan.
- **Opción B:** una llamada de TTS por línea y concatenar con `pydub` (requiere ffmpeg), con 300 a 700 ms de silencio entre intervenciones. Exporta mp3.

## 12. Evaluación (`ia/evaluacion/evaluar.py`)

Para cada caso: usa `transcripcion.json` si existe (si no, transcribe y lo guarda), extrae con el prompt y el modelo elegidos, aplica `filtros.aplicar` y compara con `esperado.json`.

**Comparación por campo**

| Esperado | Obtenido | Resultado |
|---|---|---|
| `sin_informacion` | `sin_informacion` | Correcto |
| `sin_informacion` | Con valor | **Inventado** (la meta es 0) |
| Con valor | `sin_informacion` | Omitido (separa los que vació el filtro de evidencia) |
| Con valor | Otro estado | Estado incorrecto (por ejemplo, negado contra referido) |
| Con valor | Mismo estado | Números: iguales. Texto: `token_set_ratio ≥ 70` → correcto; si no, "revisar a mano" |

En las listas, empareja los renglones por nombre normalizado (medicamento o descripción). Un renglón de más es inventado y uno de menos, omitido. Compara también las alertas esperadas (por ejemplo, `paciente_no_coincide` en el caso 05).

**Salida:** `ia/evaluacion/resultados/<fecha>_<prompt>_<modelo>.md` con una tabla por caso (correctos, inventados, omitidos, estado incorrecto y tiempo) y los totales. Ese archivo es lo que se presenta en el pitch: "En N consultas, X % de campos correctos y 0 datos inventados".

## 13. Backboard (memoria) y Tavily

**WF-2 `nota-autorizada` (S).** Django lo llama al autorizar y al corregir, sin esperar la respuesta:
- Petición: `{ "paciente_ref": "1", "memoria_ref": "<o vacío>", "nota_id": 31, "version": 2, "fecha_consulta": "2026-10-28", "texto": "<memoria.texto_para_memoria(nota)>" }`.
- Respuesta: `{ "memoria_ref": "…" }`. Django la guarda en `Paciente.memoria_ref`.
- Usa una memoria **por paciente** (un hilo o asistente por paciente, según cómo lo modele Backboard). En una corrección, el texto empieza con "Esta versión N reemplaza a la anterior de la nota X".
- `paciente_ref` es el id interno; no hace falta mandar el nombre.

**WF-5 `preguntar-expediente` (S).**
- Petición: `{ "paciente_ref", "memoria_ref", "pregunta" }`. Respuesta: `{ "respuesta", "fuentes": [ { "nota_id", "fecha_consulta", "version" } ] }`.
- Reglas del prompt: responder solo con lo que está en las notas; si no está, "No hay información registrada sobre eso"; citar nota y fecha; usar siempre la versión más reciente.

**WF-3 `referencias` con Tavily (C).**
- Petición: `{ "termino": "amoxicilina" }`. Solo el término clínico, nunca datos del paciente.
- Búsqueda (confirma el formato en la documentación de Tavily): `query` = término, `search_depth` = `basic`, `max_results` = 5, `include_domains` = medlineplus.gov, who.int, paho.org, gob.mx, imss.gob.mx y cenetec-difusion.com.
- Respuesta: `{ "resultados": [ { "titulo", "url", "fragmento" } ] }`. El frontend la muestra como "Información de apoyo; no sustituye el criterio médico".

**WF-4 `reportar-error` hacia Linear (C).** Usa el nodo de Linear de n8n: equipo `VC`, etiqueta `ia`, título "Error de IA en <campo>" y una descripción con el motivo y la hora. Sin texto clínico.

## 14. Cuándo está terminado lo tuyo

- [ ] El esquema y `procesar_faringitis.json` están en el repositorio, y German los usa.
- [ ] `medvox_ia` se importa desde Django con las firmas de la §6.
- [ ] WF-1 está activo, exportado en `n8n/` y responde con el contrato de la §10.
- [ ] CA-01: menos de 60 s por cada 5 min de audio, medido de punta a punta.
- [ ] CA-04: negado y sin información salen correctos en los casos 02 y 04.
- [ ] CA-05: **0 datos inventados** en los casos 01 a 05.
- [ ] CA-11: el caso 05 produce `paciente_no_coincide`.
- [ ] La tabla de resultados está en `ia/evaluacion/resultados/` y German la tiene para el pitch.

## 15. Trampas comunes

- **El LLM agrega calificativos** ("faringitis aguda"): la regla 5 del prompt y el caso 01 lo detectan.
- **Citas con "…" o con números reescritos:** el filtro las rechaza. La regla 10 pide copiarlas exactas; si aun así hay muchas falsas alarmas, ajusta el umbral.
- **Diarización con etiquetas cruzadas:** con 3 voces puede equivocarse; prueba con `num_speakers` y deja que el LLM asigne los roles.
- **JSON cortado:** sube el límite de tokens de salida.
- **Memoria encendida en la extracción:** mezclaría pacientes. Hilo nuevo y memoria apagada.
- **Webhook de prueba contra el de producción:** Django usa `/webhook/` con el workflow activo.
- **Créditos:** usa la caché de `transcripcion.json` y audios cortos mientras ajustas el prompt.
