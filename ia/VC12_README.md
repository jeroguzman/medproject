# VC-12 — Prueba de extracción clínica mediante Backboard

## Qué hace
1. Lee el `transcripcion.json` que produjo VC-10 (sin otra llamada a ElevenLabs).
2. Envía únicamente la transcripción a `POST https://app.backboard.io/api/threads/messages`.
3. Solicita JSON, sin memoria, sin web y con un hilo nuevo en cada extracción.
4. Aplica normalización de campos del formato v1.1 y comprueba que la evidencia citada exista literalmente en la transcripción.
5. Guarda `procesamiento_ia.json` como **borrador para revisión**.

## Preparación de entorno (PowerShell, en `medproject-git`)
```powershell
$clave = Read-Host 'Backboard API Key' -AsSecureString
$env:BACKBOARD_API_KEY = [System.Net.NetworkCredential]::new('', $clave).Password
Remove-Variable clave
$env:IA_PROVEEDOR = 'openai'
$env:IA_MODELO = 'gpt-4o'
```
El modelo es un punto de partida documentado por Backboard; se puede elegir otro disponible. No subas claves a Git.

## Pruebas offline
```powershell
cd ia
& "$HOME\Downloads\vozclinica-venv\Scripts\python.exe" -m unittest discover -s tests -v
cd ..
```

## Prueba real de IA
```powershell
& "$HOME\Downloads\vozclinica-venv\Scripts\python.exe" ia\probar_backboard.py ia\casos\caso_01_faringitis\transcripcion.json --modo dictado
```
Si necesitas elegir modelos compatibles:
`GET https://app.backboard.io/api/models?model_type=llm&supports_json_output=true` con `X-API-Key`.

**Nota sobre privacidad:** `memory='off'` evita memoria de Backboard, pero la petición crea un thread en el servicio. El script intenta eliminarlo mediante DELETE al concluir. Ninguna de estas medidas garantiza requisitos regulatorios. Usar únicamente datos ficticios. No pegar credenciales ni audios reales.

**Límites actuales:** el filtro verifica citas literales y estructura; no garantiza veracidad clínica ni completa reglas de alerta de signos vitales/paciente/alergia (esos filtros corresponden a VC-13). El modelo y la exactitud de extracción no han sido probados contra la API en esta entrega. Tras primera prueba, comparar con dictado original y crear resultados medibles.

## Coordinación
No hagas `git add ia/` hasta revisar qué archivos de audio o transcripción se generarían en el commit. La rama ya contiene el VC-01; sube VC-12 solo después de comprobar la respuesta real y guardar pruebas sin credenciales.
