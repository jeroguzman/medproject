# Despliegue automático desde main

El workflow `.github/workflows/deploy.yml` prueba backend sobre PostgreSQL 16 y
frontend en cada PR hacia main y cada push a main. Solo despliega main, después de
que ambos jobs pasen. Permite ejecución manual desde Actions sobre main.
No está activo hasta que el workflow llegue a main y se configuren los secrets.

## Configuración única

1. Fusionar la rama de despliegue con main mediante PR; debe incluir Dockerfiles,
   Compose, MojoAuth y este workflow. Conservar el archivo `.env.production` del
   Droplet. El checkout de `/opt/vozclinica` debe estar limpio. No versionar secrets.
2. Crear el environment `production` en Settings → Environments. Para despliegue
   automático sin aprobaciones, no configurar revisores obligatorios. Restringir
   las ramas permitidas a main.
3. Generar una clave exclusiva de Actions en tu computadora, sin contraseña:

   ```bash
   ssh-keygen -t ed25519 -f ./medvox-actions -C medvox-github-actions
   ```

   Agregar la línea de `medvox-actions.pub` al archivo `/root/.ssh/authorized_keys`
   del Droplet. La clave privada permite ejecutar comandos como root: mantenerla
   exclusivamente en GitHub Secrets y su copia local protegida. Se puede cambiar a
   otro usuario con permisos de Docker y escritura sobre `/opt/vozclinica`.
4. En el environment production crear estos secrets:

   | Secret | Valor |
   | --- | --- |
   | DEPLOY_HOST | 143.198.147.208 |
   | DEPLOY_USER | root |
   | DEPLOY_SSH_KEY | Contenido completo de la clave privada medvox-actions |
   | DEPLOY_KNOWN_HOSTS | Clave pública del host SSH en formato known_hosts |

   Para obtener known_hosts desde la consola confiable del Droplet:

   ```bash
   ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
   awk '{print "143.198.147.208 " $1 " " $2}' /etc/ssh/ssh_host_ed25519_key.pub
   ```

   La huella previamente confirmada es
   `SHA256:D7qE1v3p5/9Y3HMCd8HUxGtT5uL+iu88OIQER0a8wq8`.
   Si difiere, verificar el motivo antes de confiar. Guardar la segunda salida
   completa en DEPLOY_KNOWN_HOSTS; la huella por sí sola no sirve para ese secret.
   No enviar claves privadas por chat. No hace falta mover las claves de MojoAuth:
   permanecen en `.env.production` dentro del Droplet.
5. El firewall debe permitir SSH desde los runners de GitHub. Si el repositorio es
   privado, el Droplet necesita además acceso de lectura a GitHub para git fetch.
   La clave de Actions para entrar al Droplet no proporciona ese acceso inverso.
6. Ejecutar Actions → Test and deploy → Run workflow → main. Comprobar que ambos
   jobs de pruebas y deploy terminan correctamente y probar el código real de
   MojoAuth, pacientes e historial en navegador. Una vez validado, los siguientes
   pushes a main seguirán el mismo flujo automáticamente.

## Comportamiento y recuperación

Los despliegues se serializan y nunca se cancela uno durante migraciones. Se omite
un commit si main ya tiene otro más reciente. Se construyen imágenes etiquetadas
con el SHA probado y se guarda un backup antes de aplicar migraciones. No se carga
la demo ni se cambian correos, credenciales o volúmenes. El backup queda en el
Droplet; sigue siendo necesaria una copia externa.

Un fallo marca el job como fallido. Un fallo de build no cambia los contenedores;
un fallo después del arranque puede dejar servicios parcialmente actualizados.
No hay rollback automático de base de datos. Revisar logs en el servidor y las
migraciones antes de volver a una imagen anterior. Conservar los volúmenes y no
usar `down -v`. La configuración de GitHub y el primer despliegue desde Actions
requieren validación real; las pruebas locales no acreditan esa conectividad.
