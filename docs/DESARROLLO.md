# Desarrollo del backend — Jeroben

El backend Django vive en `backend/`; el frontend de German irá en `frontend/`
dentro del mismo repositorio. Python 3.12, Django 5.2 LTS y PostgreSQL 16.
Las dependencias están fijadas en requirements; no se necesita IA para acceso y pacientes.

## Primera preparación

Desde la raíz del repositorio, con Docker Compose y Python 3.12 disponibles:

```bash
python3 scripts/configure-backend-env.py
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
docker compose --env-file backend/.env up -d --wait db
set -a
. backend/.env
set +a
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py cargar_demo
python manage.py runserver 127.0.0.1:8000
```

El configurador crea `backend/.env` local con permisos restringidos y secretos
aleatorios sin mostrarlos. Si ya existe, lo conserva y termina sin reemplazarlo.
Nunca se agrega ese archivo a Git. La base escucha solo en loopback, puerto 55432;
Docker conserva sus datos en un volumen. `up` no elimina datos existentes.
No ejecutar comandos de borrado de volumen para repetir la preparación.

`cargar_demo` crea dos médicos (`pmendez`, `esalas`) y los seis pacientes de la guía.
Usan la contraseña local indicada por DEMO_PASSWORD; compartirla con German por
un canal seguro, no en commits o logs. Repetir la carga no duplica datos ni cambia
contraseñas o fichas existentes. Cambiar DEMO_PASSWORD en el archivo no cambia
contraseñas de usuarios ya creados.

Las notas de demo aún no se cargan: falta T027/VC-01 de Luis, el esquema clínico
v1.1 completo y sus ejemplos. El comando lo indica expresamente. Las rutas de
historial y lectura están implementadas, pero el historial de estos pacientes
inicialmente está vacío. Las pruebas usan registros sintéticos aislados de lectura;
no sustituyen la validación con el esquema clínico completo.

`--solo-medicos` permite preparar exclusivamente las identidades:

```bash
python manage.py cargar_demo --solo-medicos
```

## Variables por entorno

| Variable | Uso |
|---|---|
| DATABASE_URL | URL PostgreSQL con autenticación; es un valor secreto |
| DJANGO_SECRET_KEY | Secreto de firma de Django y JWT, al menos 32 caracteres |
| DEBUG | true solo en desarrollo; false activa redirección HTTPS y cookies seguras |
| ALLOWED_HOSTS | Hosts exactos separados por comas, sin esquema |
| CORS_ALLOWED_ORIGINS | Orígenes exactos con esquema/puerto, separados por comas |
| DEMO_PASSWORD | Contraseña local para nuevas identidades ficticias, no se imprime |
| POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_PORT | Servicio local de Compose |

German usa VITE_API_URL con la URL pública del backend, sin ninguna clave privada.
El origen localhost:8080 del configurador es solo un valor inicial de desarrollo;
German debe comunicar los orígenes exactos de cada entorno antes de integrarlo.
No usar `*` para CORS ni pasar credenciales de IA al frontend.

PostgreSQL de desarrollo necesita permiso para instalar `unaccent` y el usuario de
pruebas necesita CREATEDB. El servicio de Compose suministra ambos en una base local
aislada. En un servicio administrado deben comprobarse esos permisos o pedir al
administrador que prepare la extensión. SQLite no valida esta implementación.
El usuario de producción no necesita permisos para crear bases de pruebas.

## Comprobar cambios

Con el entorno y variables cargados como arriba:

```bash
cd backend  # omite este paso si ya estás en backend/
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test cuentas pacientes notas tests --verbosity 2
ruff check --config ruff.toml .
```

Las pruebas crean y eliminan una base de prueba independiente, sin usar los datos
manuales de la base de desarrollo. El runner falla si descubre cero pruebas.
Las de concurrencia requieren PostgreSQL real. Comprueban búsqueda sin acentos,
fechas, campos obligatorios, permisos, expedientes simultáneos, lectura inmutable,
PATCH de ficha y seguridad del contrato. No ejecutan todavía los flujos de IA ni
la autorización de nuevas notas de 004.

Desde la raíz, sincroniza solo después de modificar las casillas individuales:

```bash
python3 scripts/sync-team-tasks.py
python3 scripts/sync-team-tasks.py --check
```

## API disponible para German

Rutas sin slash final; cuerpos/status según el OpenAPI de 001:

- POST `/api/auth/login` recibe usuario y contrasena y devuelve access y medico.
- GET `/api/auth/me` devuelve el perfil del médico de la sesión.
- GET/POST `/api/pacientes`: búsqueda q y registro con expediente del servidor.
- GET/PATCH `/api/pacientes/{id}`: lectura y edición de ficha, expediente inmutable.
- GET `/api/pacientes/{id}/notas`: historial de versiones vigentes.
- GET `/api/notas/{id}`: contenido y versiones anteriores en solo lectura.
- GET `/api/salud`: comprobación protegida para un médico autenticado.

Todas las rutas salvo login requieren `Authorization: Bearer <access>`.
El token dura 12 horas, no incluye datos clínicos y no se refresca automáticamente.
La salida del frontend elimina la sesión local, no revoca el JWT en el servidor.
No hay endpoints de escritura de notas ni reset remoto de datos de demostración.

El expediente se asigna con una secuencia PostgreSQL, empieza en 0004-8300 y puede
contener huecos. Las altas y los ajustes administrativos usan el mismo bloqueo
transaccional para que una carga de demo no rebobine una asignación concurrente.
La unicidad se comprueba además en la base. Las versiones clínicas no admiten
UPDATE/DELETE ni mediante ORM ni mediante SQL directo, protegidas por trigger.

## Despliegue (pendiente)

HTTP loopback es solo desarrollo. Antes de desplegar, acordar proveedor y dominio,
configurar HTTPS real, DEBUG=false, hosts/orígenes exactos y conexión segura a la
base administrada. En un proxy que termina TLS, configurar la detección de esquema
únicamente según los encabezados confiables que garantice ese proveedor, evitando
redirecciones incorrectas. No se habilita confianza genérica en encabezados externos.

```bash
python manage.py collectstatic --noinput
python manage.py check --deploy
python -m gunicorn medvox.wsgi:application --bind 0.0.0.0:8000
```

Estos comandos corresponden al runtime del proveedor, con sus variables ya
inyectadas. El login tiene limitación básica de intentos por proceso para el MVP;
en un despliegue con varios procesos debe coordinarse el rate limit en el gateway
o mediante almacenamiento compartido. El backend no registra cuerpos clínicos,
tokens ni excepciones con contenido de petición; la infraestructura debe evitar
capturar esos datos también. La comprobación de HTTPS/CORS en un dominio real
(T041) sigue pendiente; las pruebas locales no acreditan un despliegue.
