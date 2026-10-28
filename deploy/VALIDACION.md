# Validación local de la preparación DigitalOcean

Fecha: 2026-10-28. Rama: codex/deploy-digitalocean-droplet. Cambios locales,
sin publicación. No se ha conectado ni modificado el Droplet del usuario.

- 61 pruebas backend aprobadas sobre PostgreSQL 16, incluyendo despliegue y carga
  de notas con el esquema completo compartido y 14 pruebas de MojoAuth.
- 27 pruebas frontend aprobadas y build de producción con MojoAuth sin mocks.
- HTTPS local: SPA y JavaScript 200, readiness 200, API sin JWT 401, contraseña
  deshabilitada 403. Correo desconocido no autentica ni envía mensajes. Las claves
  del servidor no aparecen en el JavaScript servido. No se enviaron correos reales.
- Ruff, validación de Compose y sintaxis del script de backup: aprobadas.
- Imagen sin secretos y con usuario 10001 no root: comprobado.
- Arranque de Compose aislado medproject-deploy-smoke: base saludable → migraciones/
  estáticos → Gunicorn saludable → Caddy. Segundo arranque conserva datos y pasa.
- TLS local con autoridad interna de Caddy para localhost: certificado validado
  explícitamente con su CA pública; no se desactivó la verificación TLS.
- HTTPS readiness/login/pacientes: 200; 6 pacientes ficticios. Sin JWT: 401.
- CORS: solo el origen exacto configurado recibe cabecera; otro origen se rechaza.
- HTTP redirige a HTTPS; check --deploy del contenedor no reporta incidencias.
- Perfil demo explícito crea dos médicos, seis pacientes y cinco notas con seis
  versiones completas; nunca se carga por cada arranque. La segunda carga deja
  contenidos y versiones intactos. Historial y detalle verificados por HTTPS local.
- Backup pg_dump creado y catálogo pg_restore --list válido. No se ha probado
  restauración ni almacenamiento fuera del servidor.

## Límite del build en este entorno

El DNS/proxy de los procesos Docker no permite descargar desde PyPI aquí. Para
validar la imagen se descargaron las mismas wheels fijadas mediante pip/HTTPS en
el host y se montaron como contexto temporal en el build. Se sustituyó únicamente
la instalación de red por --no-index/--find-links en un Dockerfile temporal.
La base, usuario, código y comando Gunicorn son los mismos. El Dockerfile del repo
mantiene la instalación normal por HTTPS, pendiente de ejecutar en el Droplet con
DNS/salida a PyPI. No se desactivó TLS ni se incluyeron secretos en la imagen.

## Pendiente antes de aplicar al Droplet

El usuario confirmó Droplet 143.198.147.208, root, Ubuntu 24.04, 7.8 GiB de RAM
y 153 GiB libres, puertos 80/443 libres y DNS medvox.tech apuntando al Droplet.
Docker no estaba instalado. El usuario confirmó que ya existe proyecto MojoAuth.
Faltan claves configuradas únicamente en el servidor y una prueba real de Email OTP.
La conexión SSH desde este entorno fue rechazada; el usuario sí accede a su servidor.

T041 permanece abierta: TLS local no acredita certificado público, DNS del dominio,
firewall ni acceso HTTPS/CORS del Droplet real. T028 está completada con el esquema recibido
de Luis en main. Los tests no acreditan integración E2E del frontend.
