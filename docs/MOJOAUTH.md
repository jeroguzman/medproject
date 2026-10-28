# Acceso médico con MojoAuth

Estado: integración por código de correo implementada y probada con respuestas del
proveedor simuladas; **falta validación con un proyecto real de MojoAuth**. No se ha
enviado correo real ni desplegado esta integración en el Droplet.

## Flujo

1. El médico escribe su correo autorizado en medvox.tech.
2. Django crea un reto aleatorio y solicita el OTP a MojoAuth desde el servidor.
3. El médico escribe el código recibido. El navegador entrega código y reto a Django.
4. Django verifica el código con MojoAuth usando el estado que guardó al solicitarlo.
5. Si el médico sigue activo y autorizado, emite el JWT interno usado por la API.

No se acepta un correo/usuario elegido en la verificación, un resultado autenticado
enviado por el navegador ni un JWT de proveedor sin verificar. No hace falta
incluir claves o SDK de MojoAuth en el frontend. No existe registro público de médicos.

El reto vence en 5 minutos y admite hasta 5 intentos. Su consumo se serializa en
PostgreSQL para que dos peticiones no generen dos sesiones. Solo se guarda el hash
del reto, hash del correo, usuario, estado del proveedor y metadatos de control;
no se guardan OTP ni tokens del proveedor. Hay limitación por IP y un intervalo
mínimo de un minuto entre solicitudes al mismo correo. El worker único del MVP
mantiene el cooldown; al escalar hace falta caché/rate limit compartido.

## Configuración del proyecto y del servidor

El usuario confirmó que ya existe un proyecto de MojoAuth para la aplicación.
Habilitar Email OTP en ese proyecto; es el método inicial implementado. La fuente de
la implementación es el SDK oficial publicado `mojoauth-sdk@1.4.3`, cuya API usa:

- POST `https://api.mojoauth.com/users/emailotp`, cuerpo email.
- POST `https://api.mojoauth.com/users/emailotp/verify`, cuerpo otp/state_id.
- Headers X-API-Key y, si el proyecto lo utiliza, X-API-Secret.

La respuesta de verificación debe contener authenticated=true booleano. Confirmar
con el proyecto real la entrega, caducidad y formato de respuesta antes de declarar
la integración lista; la disponibilidad o versión de su dashboard no se ha probado.

En `.env.production`, únicamente en el Droplet:

```dotenv
AUTH_PROVIDER=mojoauth
FRONTEND_MOCKS=false
MOJOAUTH_API_KEY=
MOJOAUTH_API_SECRET=
```

Completar la clave desde el dashboard en ese archivo con permisos 600, no en chat,
Git, logs ni variables VITE_. El secreto adicional solo se completa si el proyecto
lo requiere. El backend se niega a arrancar en modo MojoAuth sin una clave presente.
Una clave presente no acredita que sea válida: probar después el acceso real.

## Autorizar un médico existente

Después de aplicar migraciones y ejecutar el perfil de carga de demo:

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  exec backend python manage.py vincular_medico \
  --usuario pmendez --email TU_CORREO_AUTORIZADO
```

Sustituir el correo por el del médico que participará en la demo. El comando no
crea cuentas y rechaza usuarios sin perfil o correos ya asignados a otro usuario.
La interfaz conserva la identidad ficticia del médico para la demostración.

En modo MojoAuth, POST /api/auth/login por contraseña queda deshabilitado. El modo
password se conserva para desarrollo explícito, no como fallback ante un fallo del
proveedor. Cambiar el proveedor no revoca JWT internos emitidos anteriormente;
la expiración estándar sigue siendo de 12 horas.

## Contrato de la aplicación

- POST `/api/auth/mojoauth/start`: email → 202 con challenge_id, message y expires_in.
  Correo desconocido, inactivo o ambiguo no provoca altas ni envía mensajes y recibe
  una respuesta externa equivalente. Estado/API key del proveedor no se exponen.
- POST `/api/auth/mojoauth/verify`: challenge_id/otp → 200 con access/medico;
  401 si no es válido, venció o ya se consumió.
- 400: entrada no válida; 429: límite de solicitudes; 503: proveedor/configuración
  no disponible. Ningún error expone la respuesta privada del proveedor.
- Los endpoints de acceso emiten Cache-Control no-store.

## Acceso con Google y Facebook

Mismo principio que el código por correo: MojoAuth confirma la identidad y Django
decide si es un médico vinculado y emite su propio JWT.

1. El médico pulsa **Continuar con Google** o **Continuar con Facebook**.
2. Django crea un flujo de un solo uso (10 minutos) y devuelve la URL de MojoAuth:
   `https://api.mojoauth.com/oauth/social?api_key=…&provider=google|facebook&redirect_url=…`.
   El navegador guarda el flujo solo en esa pestaña (`sessionStorage`).
3. MojoAuth lleva al médico a Google o Facebook y lo regresa a
   `https://<API_DOMAIN>/login/social?state_id=…`. La pantalla quita el `state_id`
   de la barra de direcciones antes de usarlo.
4. Django consulta `GET https://api.mojoauth.com/users/status?state_id=…` con
   X-API-Key y X-API-Secret. Solo acepta `authenticated: true` y toma el correo de
   `user.email` o, si no viene, de `user.identifier`.
5. Si ese correo pertenece a **un único** médico activo vinculado con
   `vincular_medico`, emite el JWT interno. No hay altas automáticas.

Cada flujo recibe una sola respuesta del proveedor y cada `state_id` se acepta una
sola vez (se guarda su hash con restricción única). Un `state_id` copiado a otro
navegador no sirve sin el flujo de la pestaña original. No se guardan tokens del
proveedor. La API key viaja en la URL de MojoAuth porque así funciona su acceso
social desde el navegador; el secreto nunca sale del servidor.

Implementación basada en el código publicado de `mojoauth-web-sdk@1.17.19`
(botones sociales y `signInWithStateID`) y de `mojoauth-sdk@1.4.3` (`pingStatus`).

### Configuración

En el panel de MojoAuth (Marketplace → Add Integrations / Social Login):

- **Google:** crear un cliente OAuth "Aplicación web" en Google Cloud y registrar
  como URI de redirección autorizada la URL de callback que muestra MojoAuth para
  el proyecto (`https://api.mojoauth.com/oauth/callback/<API key del proyecto>`).
  Copiar Client ID y secreto en MojoAuth.
- **Facebook:** crear una app en Meta for Developers con el producto Facebook Login
  para Web, agregar esa misma URL de callback en "Valid OAuth Redirect URIs",
  solicitar el permiso `email` y pasar la app a modo Live. Copiar App ID y secreto
  en MojoAuth.
- Autorizar en MojoAuth el dominio y la URL de regreso `https://medvox.tech/login/social`.

En `.env.production`:

```dotenv
MOJOAUTH_SOCIAL_PROVIDERS=google,facebook
```

Compose usa ese valor para los botones del frontend y para el backend, y fija
`MOJOAUTH_REDIRECT_URL=https://${API_DOMAIN}/login/social`. Vacío oculta los botones.
Si una cuenta de Google o Facebook no comparte correo, o el correo no está vinculado,
el acceso se rechaza con 401 `acceso_social_invalido`.

### Contrato

- POST `/api/auth/mojoauth/social/start`: proveedor (`google`/`facebook`) → 200 con
  flujo, url y expires_in. 503 si el proveedor no está habilitado o configurado.
- POST `/api/auth/mojoauth/social/verify`: flujo/state_id → 200 con access/medico;
  401 si el flujo venció o ya se usó, el estado se repite o el correo no está
  autorizado; 503 si MojoAuth no responde (el flujo sigue disponible para reintentar).

## Validación pendiente y responsabilidades

Jeroben: configurar el proyecto/clave en el servidor, vincular el correo y validar
las respuestas reales, incluido el acceso con Google y Facebook: las pruebas simulan
MojoAuth y no acreditan la forma real de `/users/status` para proveedores sociales. El código y las pruebas de reto, autorización y concurrencia
están preparados. German: verificar en navegador el flujo de correo/código, errores,
expiración y navegación con el backend real. La interfaz ya compila con ese modo.

Para la demo elegida, la autorización de nuevas notas sigue pendiente y no se
presenta como capacidad operativa de este despliegue.
El frontend no usa mocks en el perfil backend seleccionado por el usuario.
