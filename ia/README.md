# Entrega VC-01 — VozClínica IA

Archivos listos para copiar a la **raíz de `medproject/`**. No están subidos al repositorio remoto.

## Incluye

- `ia/esquemas/formato_clinico_general_v1_1.json`: JSON Schema Draft 2020-12 completo.
- `ia/esquemas/ejemplos/procesar_faringitis.json`: borrador simulado del caso 01.
- `ia/esquemas/ejemplos/procesar_trampa.json`: alerta de identidad, negación y campos ausentes.
- `ia/vozclinica_ia/esquema.py`: funciones `cargar()`, `validar()`, `validar_contenido()` y `contenido_vacio()`.
- `ia/casos/caso_01_faringitis/`: guion y transcripción **simulada**, NO es resultado de ElevenLabs.
- `ia/verificar_vc01.py`: comprobación automatizada de contratos.

## Uso en PowerShell (Windows)

```powershell
git clone https://github.com/jeroguzman/medproject.git
cd medproject
# Copia la carpeta ia/ de este paquete a la raíz del repositorio
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ia/requirements.txt
python ia/verificar_vc01.py
```

## Cómo lo usan German y Jeroben

German puede usar `ia/esquemas/ejemplos/procesar_faringitis.json` como respuesta simulada del botón **Procesar**.
Jeroben puede añadir `ia/` a `sys.path` y ejecutar `from vozclinica_ia.esquema import cargar, validar, validar_contenido, contenido_vacio`.

- `validar(borrador)`: valida el objeto completo.
- `validar_contenido(borrador["secciones"])`: valida solo el contenido almacenado de la nota.
- `contenido_vacio()`: prepara todas las secciones con `sin_informacion` y listas `[]`.

## Decisiones conscientes

- El modelo no debe crear `origen`; ese atributo lo agrega la interfaz al revisar o editar.
- `alertas` se genera después de la extracción, mediante filtros deterministas.
- En el caso 01, el médico **no especifica la vía del paracetamol**, así que se deja `via: null`.
- Un campo `sin_informacion` es distinto de uno `negado`.
- Este esquema comprueba estructura, pero **no** demuestra ausencia de alucinaciones clínicas ni verifica por sí mismo las citas. Eso será VC-12 y filtros.
- La verificación de rangos mostrada en el ejemplo es ilustrativa; no equivale a validación clínica ni es segura para uso asistencial.
- No se incluyeron identificadores de paciente ni datos reales, solamente personajes de prueba.
