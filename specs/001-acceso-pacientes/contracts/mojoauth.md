# Adenda de acceso — MojoAuth

Decisión del usuario, 2026-10-28: usar MojoAuth en la demo con backend real.
Sustituye el acceso por contraseña como mecanismo del despliegue de medvox.tech;
no cambia la forma del JWT interno, los permisos médicos ni las respuestas me.

Ver [configuración y contrato](../../../docs/MOJOAUTH.md).

La implementación usa Email OTP como valor de trabajo; la elección de método y
configuración real del proyecto se deben confirmar con el usuario. Las pruebas no
acreditan un envío real, ni un acceso passwordless de un usuario real.

Solo se permiten médicos activos vinculados previamente por el operador. No se
admiten altas automáticas a partir de cualquier correo verificado. Password sigue
siendo un modo de desarrollo explícito; en modo MojoAuth el login original devuelve
403. Los fallos del proveedor no habilitan contraseña ni generan sesiones.
