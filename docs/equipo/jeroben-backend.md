# Guía de Jeroben: backend, infraestructura y despliegue

> Rol **B** del plan ([REQUERIMIENTOS §13](../REQUERIMIENTOS.md)). Si German y Jeroben prefieren intercambiar roles, basta con cambiar los nombres aquí y en la decisión D-14.

## 1. Tu parte en una frase

Construyes y despliegas la API en Django, que es la **única** que escribe en PostgreSQL. También preparas la cuenta y las credenciales de n8n, y conectas el procesamiento de audio con los filtros de Luis sin guardar nada antes de que el médico autorice.

## 2. Tus tareas

| ID | Tarea | Prio. | Cuándo |
|---|---|---|---|
| VC-02 | Proyecto Django con DRF, JWT, PostgreSQL y CORS; despliegue temprano | M | Día 1, primeras horas |
| VC-03 | Modelos (§8) y datos ficticios precargados (§9) | M | Día 1 |
| VC-04 | Endpoints de autenticación, pacientes, historial y plantilla | M | Día 1 |
| VC-14 | `/api/ia/procesar` en modos `eco`, `n8n` y `django` (§10) | M | Día 1 → hito 1 |
| VC-13 | Infraestructura de n8n: cuenta, credenciales, seguridad y ajustes (§12). Luis arma los nodos | M | Día 1 |
| VC-16 | `POST /api/notas`: autorizar con validación y transacción (§11) | M | Día 2, mañana |
| VC-17 | Versiones: `POST /api/notas/{id}/versiones` y `GET /api/notas/{id}` (§11) | M | Día 2, mañana |
| VC-20 | Alerta de paciente que no coincide: llamar a los filtros con el paciente correcto | S | Día 2 |
| VC-24 | Bitácora | S | Día 2 |
| VC-22 | Enviar la nota autorizada a WF-2 y el endpoint `/preguntar` (con Luis) | S | Día 2 |
| VC-26 | Datos de alergias para la alerta de alergia contra medicamento (con German) | C | Si sobra tiempo |
| VC-27 | Ensayo de la demo y reinicio de la base de datos antes de presentar | M | Día 2 |

## 3. Reglas que no se rompen

1. **Antes de autorizar no se guarda nada** (D-02): ni audio, ni transcripción, ni borrador. `/api/ia/procesar` no toca la base de datos ni el disco.
2. **Una `VersionNota` nunca se modifica ni se borra.** Corregir es insertar una versión nueva.
3. **n8n nunca escribe en PostgreSQL.** Solo Django escribe.
4. **Al LLM no le llegan datos del paciente** (D-13). A n8n solo le mandas el audio, el modo, el prompt y los keyterms.
5. **No guardes en logs** cuerpos de petición, transcripciones ni contenido de notas.

## 4. Con quién te coordinas

| Con | Recibes | Entregas |
|---|---|---|
| German | El dominio de Lovable para CORS | URL de la API, usuarios de prueba y el contrato de la §6. **No lo cambies sin avisar.** |
| Luis | El paquete `ia/medvox_ia` ([su guía, §6](luis-ia.md)), el esquema JSON, el contrato del webhook ([su guía, §10](luis-ia.md)) y el JSON de ejemplo | La cuenta de n8n con credenciales, la URL y el secreto del webhook, y un backend desplegado para probar de punta a punta |

## 5. Plan por hitos

**Día 1, primera hora**
- [ ] Repasar con German y Luis el contrato de la §6. Desde ese momento queda congelado.
- [ ] Esqueleto de Django desplegado con `/api/salud` respondiendo `{ "ok": true }`. Despliega temprano para no pelear con el hosting al final.
- [ ] Cuenta de n8n con Luis invitado y credenciales creadas (§12).

**Día 1, resto del día**
- [ ] Modelos, migraciones, admin y `cargar_demo`.
- [ ] Autenticación, pacientes, historial y plantilla.
- [ ] `/api/ia/procesar` en modo `eco` para que German integre sin esperar a la IA.
- [ ] Modo `n8n` con los filtros de Luis.
- [ ] **Hito 1:** audio de prueba → n8n → JSON → formulario lleno en pantalla.

**Día 2, mañana**
- [ ] Autorizar, versiones, detalle de nota y pruebas mínimas (§14).
- [ ] **Hito 2 (mediodía):** todo lo M funcionando en el ambiente desplegado.

**Día 2, tarde**
- [ ] S: bitácora, WF-2 y `/preguntar`.
- [ ] Endurecer: timeouts, CORS y logs. Ensayar `cargar_demo --reiniciar` antes de presentar.

## 6. Contrato de la API (fuente de verdad)

**Convenciones**
- JSON en UTF-8. Fechas en formato ISO `AAAA-MM-DD`, horas `HH:MM` (24 h) y fechas con hora en ISO 8601 con zona (`2026-10-28T10:52:00-06:00`). El frontend se encarga de mostrarlas como pide el DS.
- Encabezado `Authorization: Bearer <access>` en todo, salvo el inicio de sesión.
- Errores: `{ "error": { "codigo": "texto_corto", "mensaje": "Texto para mostrar" } }`. Los errores de validación devuelven 400 con `error.faltantes` (lista de rutas como `valoracion.diagnosticos`) y `error.detalles` (por campo).
- Sin paginación en el MVP: hay pocos registros.

### Autenticación

`POST /api/auth/login`
```jsonc
// petición
{ "usuario": "pmendez", "contrasena": "demo1234" }
// 200
{
  "access": "<jwt>",
  "medico": { "id": 1, "nombre_completo": "Dra. Paula Méndez Ortiz", "cedula_profesional": "12345678", "especialidad": "Medicina general" }
}
// 401
{ "error": { "codigo": "credenciales_invalidas", "mensaje": "Usuario o contraseña incorrectos." } }
```

`GET /api/auth/me` → 200 con el objeto `medico` de arriba.

### Pacientes

Objeto **Paciente**:
```json
{
  "id": 1,
  "numero_expediente": "0004-8217",
  "nombres": "María Fernanda",
  "apellido_paterno": "García",
  "apellido_materno": "López",
  "fecha_nacimiento": "1992-03-12",
  "sexo": "mujer",
  "alergias": "Penicilina (urticaria generalizada)",
  "tipo_sangre": "O+",
  "telefono": null,
  "ultima_consulta": "2026-08-14",
  "total_notas": 3
}
```

| Petición | Respuesta |
|---|---|
| `GET /api/pacientes?q=garcia` | 200 `[Paciente, …]`. Busca sin importar acentos ni mayúsculas en nombres, apellidos y expediente; si `q` parece fecha (`AAAA-MM-DD` o `DD/MM/AAAA`), busca por fecha de nacimiento |
| `POST /api/pacientes` con `{ nombres, apellido_paterno, apellido_materno?, fecha_nacimiento, sexo, alergias, telefono? }` | 201 Paciente. El sistema asigna `numero_expediente` |
| `GET /api/pacientes/{id}` | 200 Paciente |
| `PATCH /api/pacientes/{id}` (S) | 200 Paciente. El expediente no se puede cambiar |
| `GET /api/pacientes/{id}/notas` | 200 `[NotaResumen, …]`, de la más reciente a la más antigua |

Objeto **NotaResumen**:
```json
{
  "id": 12,
  "fecha_consulta": "2026-08-14",
  "hora_atencion": "10:30",
  "tipo_consulta": "primera_vez",
  "diagnostico_principal": "Faringitis, probablemente viral",
  "estado": "autorizada",
  "version_vigente": 1,
  "medico": "Dra. Paula Méndez Ortiz"
}
```
`diagnostico_principal` es la `descripcion` del primer diagnóstico de la versión vigente, o `null`.

### Plantilla

`GET /api/plantillas/formato_clinico_general/1.1` → 200 `{ "clave": "formato_clinico_general", "version": "1.1", "esquema": { …JSON Schema de Luis… } }`

### Procesar audio (no guarda nada)

`POST /api/ia/procesar`, en `multipart/form-data`:

| Campo | Tipo | Notas |
|---|---|---|
| `audio` | archivo | Máximo 50 MB |
| `paciente_id` | entero | Solo sirve para los filtros (nombre y alergias). **No se envía a n8n** |
| `modo` | `dictado` \| `consulta` | |

200:
```json
{
  "transcripcion": {
    "texto": "Buenos días, pásele…",
    "segmentos": [
      { "hablante": "HABLANTE_1", "rol": "medico", "texto": "Buenos días, pásele. ¿Usted es María Fernanda García?", "inicio": 0.0, "fin": 3.8 },
      { "hablante": "HABLANTE_2", "rol": "paciente", "texto": "Sí, doctora, buenos días.", "inicio": 4.1, "fin": 5.6 }
    ]
  },
  "borrador": { "plantilla": "formato_clinico_general", "version": "1.1", "modo_captura": "consulta", "paciente_mencionado": "María Fernanda García", "hablantes": { "HABLANTE_1": "medico", "HABLANTE_2": "paciente" }, "secciones": { } },
  "alertas": [
    { "tipo": "fuera_de_rango", "severidad": "advertencia", "campo": "signos_vitales.temperatura", "mensaje": "38.4 °C fuera de rango (36.0–37.5 °C)", "bloquea": false }
  ],
  "metricas": { "duracion_audio_s": 184.2, "ms_transcripcion": 8200, "ms_extraccion": 17400, "ms_total": 26900 }
}
```
`borrador.secciones` siempre trae **todos** los campos de la plantilla, ya normalizados por los filtros (REQUERIMIENTOS §7.4).

Errores: 400 `audio_invalido` · 413 `audio_muy_grande` · 502 `ia_fallo` (con un mensaje que se pueda mostrar) · 504 `ia_tiempo_agotado`.

### Notas

`POST /api/notas` (autorizar):
```json
{
  "paciente_id": 1,
  "plantilla": { "clave": "formato_clinico_general", "version": "1.1" },
  "fecha_consulta": "2026-10-28",
  "hora_atencion": "10:30",
  "tipo_consulta": "seguimiento",
  "modo_captura": "consulta",
  "consentimiento_grabacion": true,
  "contenido": { "motivo_padecimiento": { }, "antecedentes": { } },
  "transcripcion": { "texto": "…", "segmentos": [ ] }
}
```
`contenido` es `borrador.secciones` tal como lo dejó el médico, con `origen` en cada campo. 201 → **NotaDetalle**. 400 `validacion` con `faltantes`.

Objeto **NotaDetalle** (también es la respuesta de `GET /api/notas/{id}`):
```json
{
  "id": 31,
  "paciente": { "…": "Paciente" },
  "medico": { "id": 1, "nombre_completo": "Dra. Paula Méndez Ortiz", "cedula_profesional": "12345678" },
  "plantilla": { "clave": "formato_clinico_general", "version": "1.1" },
  "fecha_consulta": "2026-10-28",
  "hora_atencion": "10:30",
  "tipo_consulta": "seguimiento",
  "modo_captura": "consulta",
  "consentimiento_grabacion": true,
  "estado": "corregida",
  "version_vigente": 2,
  "versiones": [
    { "numero": 2, "contenido": { }, "transcripcion": { }, "autorizada_por": "Dra. Paula Méndez Ortiz", "autorizada_en": "2026-10-28T11:20:00-06:00", "motivo_cambio": "Se corrige la dosis de paracetamol" },
    { "numero": 1, "contenido": { }, "transcripcion": { }, "autorizada_por": "Dra. Paula Méndez Ortiz", "autorizada_en": "2026-10-28T10:52:00-06:00", "motivo_cambio": null }
  ]
}
```

`POST /api/notas/{id}/versiones` (autorizar corrección):
```json
{ "contenido": { }, "motivo_cambio": "Se corrige la dosis de paracetamol", "version_base": 1 }
```
201 → NotaDetalle · 400 `validacion` · 409 `version_desactualizada` si `version_base` ya no es la vigente.

### Funciones de apoyo

| Petición | Respuesta | Prio. |
|---|---|---|
| `POST /api/pacientes/{id}/preguntar` con `{ "pregunta": "¿Qué alergias tiene?" }` | 200 `{ "respuesta": "…", "fuentes": [ { "nota_id": 12, "fecha_consulta": "2026-08-14", "version": 1 } ] }` | S |
| `GET /api/referencias?termino=amoxicilina` | 200 `{ "resultados": [ { "titulo": "…", "url": "…", "fragmento": "…" } ] }` | C |
| `POST /api/ia/reportar-error` con `{ "campo": "plan.medicamentos[0]", "motivo": "valor_incorrecto" }` (`motivo`: `valor_incorrecto` \| `inventado` \| `omitido`) | 202 | C |

## 7. Proyecto Django

```
backend/
  manage.py
  requirements.txt        # incluye la línea -r ../ia/requirements.txt
  medvox/             # settings, urls, wsgi
  cuentas/                # Medico, login, me
  pacientes/              # Paciente, búsqueda, historial
  notas/                  # Plantilla, Nota, VersionNota, Bitacora, autorizar, versiones
  ia_api/                 # procesar, preguntar, referencias, reportar-error; cliente de n8n
```

**Dependencias:** `Django>=5.1`, `djangorestframework`, `djangorestframework-simplejwt`, `django-cors-headers`, `psycopg[binary]`, `dj-database-url`, `gunicorn`, `whitenoise` y `requests`. Las del paquete de IA (`jsonschema`, `rapidfuzz`, etc.) llegan con `-r ../ia/requirements.txt`.

**Ajustes clave** (`settings.py`):
```python
import sys
from datetime import timedelta

sys.path.append(str(BASE_DIR.parent / "ia"))  # hace importable medvox_ia

INSTALLED_APPS += [
    "django.contrib.postgres", "rest_framework", "corsheaders",
    "cuentas", "pacientes", "notas", "ia_api",
]
MIDDLEWARE.insert(0, "corsheaders.middleware.CorsMiddleware")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(hours=12)}  # sin refresh en el MVP

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")  # dominios exactos que te pase German

# El audio se procesa en memoria: nunca toca el disco.
FILE_UPLOAD_HANDLERS = ["django.core.files.uploadhandler.MemoryFileUploadHandler"]
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024

LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Mexico_City"
USE_TZ = True
```
Con solo el manejador en memoria, un archivo de más de 50 MB llega con `request.FILES` vacío: en ese caso responde 413 `audio_muy_grande`.

## 8. Modelos

```python
class Medico(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.PROTECT, related_name="medico")
    nombre_completo = models.CharField(max_length=200)
    cedula_profesional = models.CharField(max_length=20)
    especialidad = models.CharField(max_length=100)

class Paciente(models.Model):
    numero_expediente = models.CharField(max_length=9, unique=True)  # 0004-8217
    nombres = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True)
    fecha_nacimiento = models.DateField()
    sexo = models.CharField(max_length=20, choices=[("mujer", "Mujer"), ("hombre", "Hombre"), ("no_especificado", "No especificado")])
    alergias = models.TextField()                 # "Sin alergias conocidas" explícito
    tipo_sangre = models.CharField(max_length=3, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    memoria_ref = models.CharField(max_length=100, blank=True)  # S: referencia en Backboard
    creado_por = models.ForeignKey(Medico, on_delete=models.PROTECT)
    creado_en = models.DateTimeField(auto_now_add=True)

class Plantilla(models.Model):
    clave = models.CharField(max_length=50)
    version = models.CharField(max_length=10)
    esquema = models.JSONField()
    activa = models.BooleanField(default=True)
    class Meta:
        unique_together = [("clave", "version")]

class Nota(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name="notas")
    medico = models.ForeignKey(Medico, on_delete=models.PROTECT)
    plantilla = models.ForeignKey(Plantilla, on_delete=models.PROTECT)
    fecha_consulta = models.DateField()
    hora_atencion = models.TimeField()
    tipo_consulta = models.CharField(max_length=20, choices=[("primera_vez", "Primera vez"), ("seguimiento", "Seguimiento")])
    modo_captura = models.CharField(max_length=10, choices=[("dictado", "Dictado"), ("consulta", "Consulta")])
    consentimiento_grabacion = models.BooleanField(default=False)
    estado = models.CharField(max_length=12, choices=[("autorizada", "Autorizada"), ("corregida", "Corregida")])
    version_vigente = models.PositiveIntegerField(default=1)
    creada_en = models.DateTimeField(auto_now_add=True)

class VersionNota(models.Model):
    nota = models.ForeignKey(Nota, on_delete=models.PROTECT, related_name="versiones")
    numero = models.PositiveIntegerField()
    contenido = models.JSONField()
    transcripcion = models.JSONField(null=True)   # { texto, segmentos }; el audio nunca
    autorizada_por = models.ForeignKey(Medico, on_delete=models.PROTECT)
    autorizada_en = models.DateTimeField()
    motivo_cambio = models.TextField(blank=True)

    class Meta:
        unique_together = [("nota", "numero")]
        ordering = ["-numero"]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Las versiones de una nota no se modifican.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Las versiones de una nota no se borran.")

class Bitacora(models.Model):  # S
    medico = models.ForeignKey(Medico, on_delete=models.PROTECT)
    accion = models.CharField(max_length=20)      # ver | autorizar | corregir | exportar | preguntar
    entidad = models.CharField(max_length=20)     # paciente | nota
    entidad_id = models.PositiveIntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
```

Notas:
- **Búsqueda sin acentos:** crea la extensión `unaccent` con una migración (`django.contrib.postgres.operations.UnaccentExtension`) y filtra con `nombres__unaccent__icontains=q`.
- **Expediente nuevo:** toma el número máximo, súmale uno y dale formato `f"{n // 10000:04d}-{n % 10000:04d}"`. Los pacientes de prueba ocupan del 0004-8011 al 0004-8299; los nuevos empiezan en 0004-8300.
- **Admin:** registra todo. `VersionNota` va en solo lectura; sirve para mostrar en la demo que antes de autorizar no hay ningún registro.

## 9. Datos de demo (`python manage.py cargar_demo`)

Debe poder ejecutarse varias veces sin duplicar (`get_or_create`). Con `--reiniciar`, borra las notas y vuelve a crear todo. Las versiones se borran con `QuerySet.delete()` porque el `delete()` del modelo está bloqueado. Los nombres coinciden con el DS y con los casos de prueba de Luis: no los cambies sin avisar.

**Médicos** (contraseña `demo1234`, solo para la demo)

| Usuario | Nombre | Cédula (ficticia) | Especialidad |
|---|---|---|---|
| `pmendez` | Dra. Paula Méndez Ortiz | 12345678 | Medicina general |
| `esalas` | Dr. Ernesto Salas Ibarra | 87654321 | Medicina general |

**Pacientes**

| Expediente | Nombre | Nacimiento | Sexo | Alergias | Sangre | Notas previas |
|---|---|---|---|---|---|---|
| 0004-8217 | GARCÍA LÓPEZ, María Fernanda | 1992-03-12 | mujer | Penicilina (urticaria generalizada) | O+ | 2026-08-14 Faringitis (Méndez) · 2026-02-03 Control anual (Méndez) · 2025-09-21 Infección de vías urinarias (Salas) |
| 0004-8150 | RAMÍREZ SOTO, Jorge | 1968-05-20 | hombre | Sin alergias conocidas | A+ | 2026-07-10 Hipertensión arterial sistémica, losartán 50 mg (Méndez) |
| 0004-8011 | CASTILLO VEGA, Rosa Elena | 1960-06-02 | mujer | Sulfas (exantema) | B+ | 2026-06-15 Diabetes mellitus tipo 2, metformina 850 mg (Méndez) |
| 0004-8233 | TORRES MEDINA, Luis Alberto | 1985-01-15 | hombre | Sin alergias conocidas | O+ | — |
| 0004-8102 | HERNÁNDEZ RUIZ, Ana Sofía | 2019-05-03 | mujer | Sin alergias conocidas | — | — |
| 0004-8299 | PÉREZ GÓMEZ, Juan Carlos | 1979-11-30 | hombre | Sin alergias conocidas | — | — |

Para el `contenido` de las notas previas, parte de `medvox_ia.esquema.contenido_vacio()` (lo da Luis) y llena solo motivo, padecimiento, diagnóstico y plan. La plantilla se carga desde `ia/esquemas/formato_clinico_general_v1_1.json`.

## 10. `/api/ia/procesar`

Se elige el modo con la variable `IA_ORQUESTADOR`:

| Modo | Qué hace | Para qué |
|---|---|---|
| `eco` | Espera 3 s y devuelve `ia/esquemas/ejemplos/procesar_faringitis.json` | Que German integre desde el día 1 sin esperar a la IA |
| `n8n` | Manda el audio al WF-1 de n8n y aplica los filtros | **Modo normal** |
| `django` | Llama a `medvox_ia.pipeline` directamente, sin n8n | Plan C si n8n falla en la demo |

```python
from medvox_ia import extraccion, filtros, pipeline

def procesar(request):
    audio = request.FILES.get("audio")
    if audio is None:
        return error(413, "audio_muy_grande", "El audio supera 50 MB.")
    modo = request.data["modo"]
    paciente = get_object_or_404(Paciente, pk=request.data["paciente_id"])

    if settings.IA_ORQUESTADOR == "n8n":
        r = requests.post(
            f"{settings.N8N_BASE_URL}/webhook/procesar-audio",
            headers={"X-MedVox-Secret": settings.N8N_SECRET},
            data={
                "modo": modo,
                "prompt": extraccion.prompt_sistema(modo),
                "keyterms": json.dumps(extraccion.keyterms()),
            },
            files={"audio": (audio.name, audio.read(), audio.content_type)},
            timeout=170,
        )
        r.raise_for_status()
        datos = r.json()
        transcripcion = datos["transcripcion"]
        borrador = extraccion.parsear(datos["extraccion_raw"])
        metricas = datos["metricas"]  # agrega metricas["ms_total"] con tu propio cronómetro
    elif settings.IA_ORQUESTADOR == "django":
        transcripcion, borrador, metricas = pipeline.transcribir_y_extraer(audio.read(), audio.name, modo)
    else:
        return Response(cargar_ejemplo_eco())

    borrador, alertas = filtros.aplicar(borrador, transcripcion, paciente_a_dict(paciente), modo)
    return Response({"transcripcion": transcripcion, "borrador": borrador, "alertas": alertas, "metricas": metricas})
```
Esto es un esquema: maneja los errores de `requests` (timeout → 504, cualquier otro → 502) y los de `extraccion.parsear`. El contrato exacto del webhook y de las funciones está en la [guía de Luis](luis-ia.md), §6 y §10.

- **Gunicorn:** `--timeout 180`. Revisa también el límite de tiempo del proxy de tu hosting: algunos cortan cerca de los 100 s.
- **Plan B** (si las peticiones largas se cortan): `procesar` devuelve `{ "trabajo_id": "…" }`, ejecuta el trabajo en un hilo y guarda el resultado en la **caché en memoria** (`LocMemCache`, 15 min). El frontend consulta `GET /api/ia/procesar/{trabajo_id}`. Para que la caché se comparta, usa un solo worker con varios hilos (`--workers 1 --threads 8`). No uses la caché en base de datos: rompería D-02.

## 11. Autorizar y versiones

**`POST /api/notas`**
```python
@transaction.atomic
def autorizar(request):
    datos = NotaEntradaSerializer(data=request.data)
    datos.is_valid(raise_exception=True)
    contenido = datos.validated_data["contenido"]

    errores = esquema.validar(contenido)          # medvox_ia.esquema
    faltantes = faltantes_para_autorizar(contenido, datos.validated_data)
    if errores or faltantes:
        return error_validacion(faltantes, errores)

    medico = request.user.medico                  # nunca del cuerpo de la petición
    nota = Nota.objects.create(..., medico=medico, estado="autorizada", version_vigente=1)
    VersionNota.objects.create(nota=nota, numero=1, contenido=contenido,
                               transcripcion=datos.validated_data.get("transcripcion"),
                               autorizada_por=medico, autorizada_en=timezone.now())
    transaction.on_commit(lambda: notificar_nota_autorizada(nota.id))  # S: WF-2, no bloquea
    return Response(NotaDetalleSerializer(nota).data, status=201)
```

**Obligatorios** (P-04, `faltantes_para_autorizar`):
- `fecha_consulta`, `hora_atencion` y `tipo_consulta`.
- `motivo_padecimiento.motivo_consulta` y `motivo_padecimiento.padecimiento_actual` con `valor`.
- `valoracion.diagnosticos`: al menos uno con `descripcion` y `condicion`.
- `plan.medicamentos` con al menos un renglón, **o** `plan.medidas_seguimiento` con `valor`.
- Si `modo_captura` es `consulta`, `consentimiento_grabacion` debe ser `true`.

German valida lo mismo en el frontend, pero la regla que vale es la tuya.

**`POST /api/notas/{id}/versiones`**
```python
with transaction.atomic():
    nota = Nota.objects.select_for_update().get(pk=pk)
    if datos["version_base"] != nota.version_vigente:
        return error(409, "version_desactualizada", "La nota cambió mientras la corregías.")
    # validar igual que al autorizar; motivo_cambio es obligatorio
    nueva = nota.version_vigente + 1
    VersionNota.objects.create(nota=nota, numero=nueva, contenido=..., transcripcion=vigente.transcripcion,
                               autorizada_por=request.user.medico, autorizada_en=timezone.now(),
                               motivo_cambio=datos["motivo_cambio"])
    nota.version_vigente = nueva
    nota.estado = "corregida"
    nota.save(update_fields=["version_vigente", "estado"])
    transaction.on_commit(lambda: notificar_nota_autorizada(nota.id))  # S: WF-2 también en correcciones
```

`notificar_nota_autorizada` manda la nota a WF-2 en un hilo, con un timeout corto, y guarda el `memoria_ref` que devuelve. Si falla, solo se registra el error: nunca bloquea la autorización.

## 12. Infraestructura de n8n

Luis arma los nodos; tú dejas lista la base:
1. **Cuenta:** n8n Cloud con los créditos del hackathon. Invita a Luis.
2. **Credenciales** (en *Credentials*, nunca escritas dentro de los nodos):
   - `ElevenLabs`: Header Auth con `xi-api-key`.
   - `Backboard`: lo que pida su API (revisar docs.backboard.io).
   - `MedVox webhook`: Header Auth con el encabezado `X-MedVox-Secret` y un secreto largo y aleatorio. Ese mismo secreto va en `N8N_SECRET` de Django.
   - (C) `Tavily` y `Linear`.
3. **URL:** el webhook de producción es `https://<tu-espacio>.app.n8n.cloud/webhook/procesar-audio`. La URL `/webhook-test/…` solo funciona con el editor abierto. **El workflow tiene que estar activo.**
4. **Ajustes de cada workflow:** en la demo, "Save successful production executions: Do not save", para que no queden audios ni transcripciones. Durante el desarrollo puedes guardar las fallidas para depurar.
5. **Webhooks que llama Django:** `procesar-audio` (M), `nota-autorizada` (S), `preguntar-expediente` (S), `referencias` (C) y `reportar-error` (C). Contratos en la [guía de Luis](luis-ia.md), §10 y §13.

## 13. Despliegue y variables de entorno

Recomendación (P-05): **Railway** (o Render) para Django y PostgreSQL, y n8n Cloud.
- **El servicio se construye desde la raíz del repositorio**, no desde `backend/`: si eliges `backend/` como raíz, se pierde `ia/`.
- Comando de construcción: `pip install -r backend/requirements.txt`.
- Comando de inicio: `cd backend && python manage.py migrate && python manage.py cargar_demo && gunicorn medvox.wsgi --bind 0.0.0.0:$PORT --timeout 180 --workers 1 --threads 8`.
- Archivos estáticos del admin con WhiteNoise (`collectstatic` en la construcción).

| Variable | Ejemplo / nota |
|---|---|
| `DJANGO_SECRET_KEY` | Aleatoria |
| `DJANGO_DEBUG` | `false` en el ambiente desplegado |
| `ALLOWED_HOSTS` | Dominio de la API |
| `CSRF_TRUSTED_ORIGINS` | `https://<dominio-api>` (solo para el admin) |
| `DATABASE_URL` | La da el hosting |
| `CORS_ALLOWED_ORIGINS` | Dominios de Lovable que te pase German (vista previa y publicado) |
| `IA_ORQUESTADOR` | `eco` → `n8n` (`django` como plan C) |
| `N8N_BASE_URL` | `https://<tu-espacio>.app.n8n.cloud` |
| `N8N_SECRET` | El mismo de la credencial del webhook |
| `ELEVENLABS_API_KEY`, `BACKBOARD_API_KEY` | Solo para el modo `django` (plan C) |

Las claves **nunca** van al repositorio ni al frontend.

## 14. Pruebas mínimas (Django `TestCase`)

- [ ] **CA-02:** con `IA_ORQUESTADOR=eco`, `POST /api/ia/procesar` no cambia el número de filas de `Nota` ni de `VersionNota`.
- [ ] **CA-08:** `POST /api/notas` sin token responde 401.
- [ ] **CA-06:** `POST /api/notas` sin diagnóstico responde 400 con `valoracion.diagnosticos` en `faltantes`.
- [ ] **CA-07:** una autorización válida crea la nota y la versión 1, y la nota aparece en `/pacientes/{id}/notas`.
- [ ] **CA-09:** una corrección crea la versión 2; la versión 1 no cambia; con una `version_base` vieja responde 409.
- [ ] `VersionNota.save()` sobre una versión existente lanza un error.

## 15. Cuándo está terminado lo tuyo

- [ ] La API está desplegada con HTTPS, con los datos de demo cargados y German consumiéndola.
- [ ] `/api/ia/procesar` funciona en los modos `n8n` y `django`, y devuelve el contrato de la §6.
- [ ] Las pruebas de la §14 pasan.
- [ ] `cargar_demo --reiniciar` deja todo listo para presentar.

## 16. Trampas comunes

- **CORS:** el dominio de vista previa de Lovable es distinto del publicado; agrega los dos.
- **Hora:** con `USE_TZ = True`, guarda en UTC y devuelve con la zona de México. `hora_atencion` es la hora local que elige el médico.
- **Webhook de n8n en modo prueba:** `/webhook-test/` deja de responder cuando se cierra el editor. Usa `/webhook/` con el workflow activo.
- **Logs con datos clínicos:** revisa que ni gunicorn ni Django impriman cuerpos de petición. No uses `print(request.data)`.
- **El audio llega vacío:** si `request.FILES` está vacío, el archivo excedió el límite (§7).
- **Peticiones largas:** si el hosting corta antes de 180 s, pasa al plan B de la §10.
