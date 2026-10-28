# Aplicación en un Droplet de DigitalOcean

Configuración preparada para un Droplet existente. No crea recursos de pago ni
modifica por sí sola un servidor. Antes de ejecutar allí, confirmar IP, usuario
SSH, distribución, dominio y qué servicios/datos existen. No usar estos comandos
sobre una instalación con datos sin inventario y copia de seguridad.

## Arquitectura

Caddy recibe 80/443 y gestiona el certificado HTTPS del dominio. Gunicorn y
PostgreSQL no publican puertos al host. La base usa una red Docker interna;
backend y proxy comparten otra red. Los volúmenes de PostgreSQL y certificados
persisten entre actualizaciones. Este diseño aloja también la base en el Droplet,
no utiliza PostgreSQL administrado y comparte con el servidor su disponibilidad.

El frontend del mismo repositorio se compila y sirve desde Caddy. Para la demo,
`https://medvox.tech` aloja la aplicación y `/api/` se dirige al backend del mismo
origen. No hace falta un subdominio adicional. El modo elegido usa backend real
y MojoAuth. El procesamiento de audio (`POST /api/ia/procesar`) y la autorización
de notas nuevas (`POST /api/notas`) están integrados; las correcciones con nuevas
versiones todavía no.

## Prerrequisitos del Droplet

- Docker Engine y plugin Docker Compose v2, Git y Python 3 instalados.
  Para Ubuntu, seguir la [instalación oficial](https://docs.docker.com/engine/install/ubuntu/)
  correspondiente a la versión real del servidor.
- Memoria/disco suficientes para backend, PostgreSQL y construcción de la imagen.
  Verificar `free -m` y `df -h`; no asumir que el tamaño actual alcanza.
- DNS A del dominio de API hacia la IP pública del Droplet. Si hay un registro
  AAAA, debe apuntar también a una interfaz IPv6 válida del mismo servidor.
- Entrada TCP 80 y 443 permitida en firewall del host y Cloud Firewall de DigitalOcean;
  mantener el acceso SSH existente antes de cambiar reglas. Salida DNS/HTTPS para
  Docker Hub, PyPI y la autoridad de certificados.
- Los puertos 80/443 deben estar libres. Si ya los ocupa Nginx, Apache, Caddy u otra
  app, integrar la API con el proxy existente antes de levantar este Compose;
  no detener ni sustituir servicios sin revisar su configuración.

Inspección inicial, de solo lectura:

```bash
cat /etc/os-release
free -m
df -h
sudo ss -lntp
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
```

La cuenta SSH debe tener permiso para usar Docker. No enviar claves privadas,
contraseñas de DigitalOcean ni tokens por chat.

## Primera instalación (después del inventario)

Clonar el repositorio en un directorio dedicado, por ejemplo `/opt/vozclinica`, con
un mecanismo GitHub autorizado en el Droplet. No escribir tokens en URLs de clonación.
Usar el commit revisado que contiene `compose.production.yaml`, sin reutilizar otro
checkout con cambios locales.

Para la demo preparada en esta rama:

```bash
git clone --branch codex/deploy-digitalocean-droplet --single-branch \
  https://github.com/jeroguzman/medproject.git /opt/vozclinica
cd /opt/vozclinica
```

Si el repositorio es privado, usar una credencial autorizada de GitHub en el servidor.
Desde esa raíz:

```bash
python3 scripts/configure-production-env.py \
  --domain medvox.tech \
  --frontend-origin https://medvox.tech --demo-mode backend --auth-provider mojoauth
```

Sustituir ambos dominios por los reales. El script crea `.env.production` con
permisos 600 y secretos aleatorios para PostgreSQL, firma Django y médicos de demo.
No imprime secretos, no crea recursos y nunca reemplaza un archivo existente.
Si ya existe, revisa los valores no secretos antes de continuar; el script no los
actualiza. No usar en producción el `.env.production` local de pruebas.

Antes de arrancar, completar las claves de MojoAuth en el servidor según
[MOJOAUTH.md](MOJOAUTH.md). No pegar claves en chat. El script deja esos campos
vacíos deliberadamente; con modo MojoAuth sin API key el backend no arrancará.

```bash
docker compose --env-file .env.production -f compose.production.yaml config --quiet
docker compose --env-file .env.production -f compose.production.yaml build
docker compose --env-file .env.production -f compose.production.yaml up -d --wait
docker compose --env-file .env.production -f compose.production.yaml ps
```

El servicio `prepare` aplica migraciones y recoge estáticos antes de iniciar el
backend. Un fallo detiene el arranque de dependencias; no se presenta como despliegue
exitoso. Las migraciones usan la base interna y no exponen credenciales en argumentos.

Gunicorn usa un worker para que el límite básico de intentos del MVP no se fragmente
entre procesos, con 8 hilos para que un audio en proceso no bloquee al resto de la
aplicación. No se afirma que ese límite sobreviva a reinicios; al escalar se
requiere un rate limit compartido. El timeout de 180 s cubre `POST /api/ia/procesar`.

## Procesamiento de audio (IA)

`POST /api/ia/procesar` recibe el audio, lo procesa en memoria y devuelve
transcripción, borrador y alertas. No guarda audio, transcripción ni borrador en
disco o base de datos. `IA_ORQUESTADOR` en `.env.production` elige cómo:

| Valor | Qué hace | Variables necesarias |
|---|---|---|
| `n8n` (predeterminado) | Envía el audio al workflow WF-1 (`/webhook/procesar-audio`) y aplica los filtros de Django | `N8N_BASE_URL` (por ejemplo `https://tu-espacio.app.n8n.cloud`, sin `/webhook`) y `N8N_SECRET` (el mismo de la credencial `X-VozClinica-Secret`) |
| `django` | Plan C: llama a ElevenLabs y Backboard desde Django, sin n8n | `ELEVENLABS_API_KEY` y `BACKBOARD_API_KEY` |
| `eco` | Espera 3 s y devuelve el caso de ejemplo de faringitis, sin importar el audio | Ninguna. Solo para integración; no presentarlo como procesamiento real |

Sin esas variables, el endpoint responde 503 `ia_no_configurada` y la pantalla
de la consulta lo indica; el resto de la aplicación funciona normalmente. Los datos
del paciente nunca se envían a n8n ni a los proveedores; solo se usan en los filtros.
El workflow de n8n debe estar **activo** (la URL `/webhook-test/` no sirve).

Si `.env.production` ya existe, agregar estas líneas a mano (el script de
configuración no modifica un archivo existente) y volver a levantar el backend:

```bash
docker compose --env-file .env.production -f compose.production.yaml up -d --wait backend
```

## Identidades ficticias de la demo

No se cargan pacientes o médicos automáticamente en cada arranque. Para preparar
la demo de datos ficticios una vez, con la base ya disponible:

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  --profile demo run --rm demo
```

El perfil demo explícito está definido en Compose y recibe DEMO_PASSWORD sin
incluir su valor en los argumentos del proceso.
La contraseña queda solo en `.env.production`; compartirla por un canal seguro.
Repetir la carga no reinicia contraseñas ni sobrescribe fichas. La carga incluye cinco notas ficticias, seis versiones y el esquema completo
compartido con Luis. Se valida antes de escribir y no reemplaza notas existentes.

## Validar y cerrar T041

```bash
curl --fail --show-error https://medvox.tech/healthz
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T backend python manage.py check --deploy
```

`/healthz` es una comprobación pública de infraestructura: devuelve solo ok y consulta
la disponibilidad de la base, sin datos clínicos. `/api/salud` conserva autenticación.
Después de cargar la demo, vincular el correo autorizado con `vincular_medico`
como se describe en MOJOAUTH.md. Verificar acceso real con código/me, rechazo 401
sin JWT en pacientes y CORS con el origen
frontend exacto. No desactivar la verificación de certificado con curl -k.
El DNS, el certificado público y la integración del frontend deben validarse en
el dominio real antes de marcar T041 completa.

Django confía en X-Forwarded-Proto **solo** cuando DJANGO_TRUST_PROXY_HEADERS=true.
Compose habilita esa confianza porque backend no tiene puerto público y Caddy es
la entrada. No publicar Gunicorn directamente manteniendo ese flag activo.
El proxy no activa logs de acceso con cabeceras o contenido clínico.

## Copia de seguridad y actualización

Con la base levantada:

```bash
bash scripts/backup-production.sh
```

Crea un dump PostgreSQL en `backups/`, excluido de Git, con permisos restrictivos.
Debe copiarse a almacenamiento separado del Droplet mediante el canal acordado;
un archivo en el mismo disco no protege frente a pérdida del servidor. Probar la
restauración en una base aislada antes de depender de él; no restaurar sobre datos
existentes como parte de un despliegue rutinario.

Para actualizar: revisar el commit de destino, hacer backup, construir la imagen
y ejecutar `up -d --wait` nuevamente. Etiquetar cada release mediante APP_IMAGE_TAG
para conservar la imagen anterior; no hacer `docker system prune` durante el despliegue.
Revisar migraciones antes de decidir rollback: una imagen anterior no revierte la base.
Nunca usar `down -v` ni borrar volúmenes como paso de actualización.

## Despliegue automático

Para actualizar desde main tras pasar las pruebas, configurar
[GitHub Actions](DEPLOY_AUTOMATICO.md). Requiere secrets SSH en GitHub y
una primera ejecución real validada.
