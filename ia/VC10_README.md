# VC-10 — Primera transcripción de voz

El objetivo de esta entrega es pasar de **audio ficticio** a `transcripcion.json` con hablantes y tiempos.

## Requisitos
- Python con `requests` (`pip install -r ia/requirements.txt` desde raíz).
- Cuenta ElevenLabs con acceso a Speech to Text y créditos disponibles.
- `ELEVENLABS_API_KEY` disponible en la sesión de PowerShell. Nunca subas claves ni `.env` a GitHub.

## Configuración (PowerShell en la raíz de medproject-git)

```powershell
$env:ELEVENLABS_API_KEY = Read-Host "Pega tu API key de ElevenLabs"
```

El valor no se muestra al ejecutar el script, pero esa variable vive en la sesión actual de PowerShell. Para entrada sin eco puedes usar `$seguro = Read-Host -AsSecureString` y convertirlo a texto solo para asignarlo como variable, pero no es necesario para esta demo con credenciales temporales.

## Test local sin conexión

```powershell
& "$HOME\Downloads\vozclinica-venv\Scripts\python.exe" -m unittest discover -s ia/tests -v
```

## Audio ficticio
Abre `ia/casos/caso_01_faringitis/guion.md`, graba una lectura de 30 a 60 segundos usando la grabadora de Windows. Usa voz real, con dos personas si puedes, y guarda el resultado en `ia/casos/caso_01_faringitis/audio_real.wav` (también admite mp3 o webm). No uses pacientes reales.

## Primera llamada real

```powershell
& "$HOME\Downloads\vozclinica-venv\Scripts\python.exe" ia/probar_scribe.py "ia/casos/caso_01_faringitis/audio_real.wav" --modo consulta
```

El resultado se escribe en `ia/casos/caso_01_faringitis/transcripcion.json` y se muestra en la terminal.

Para probar con un único médico dictando, usa `--modo dictado`. Para comparar con Scribe Medical, prueba una **segunda vez**, si el servicio te lo permite, ajustando `ELEVENLABS_MODEL_ID` a `scribe_v2_medical` y especificando `--salida ...` para no sobrescribir la primera transcripción. Scribe v2 es el modelo de referencia de VC-10.

## Límites
- La diarización detecta voces, **no garantiza quién es el médico**.
- Una transcripción fluida no implica precisión clínica. Revisa números, negaciones y medicamentos frente al guion.
- La llamada real a ElevenLabs no se puede ejecutar sin credenciales y audio.
- Este archivo implementa `stt.py`; **todavía NO implementa extracción clínica ni los filtros**.
