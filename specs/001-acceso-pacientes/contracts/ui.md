# Contrato de interfaz — acceso y pacientes

Fuente: guía frontend §§6–7 y Design System v0.4 con adaptaciones del MVP.
El código se implementará en `frontend/` de medproject por instrucción del usuario.

| Ruta | Contenido / transición | Prioridad |
|---|---|---|
| /login | Usuario, contraseña y acceso; permite pegar y gestores de contraseñas | M |
| /pacientes | Buscar, lista y formulario Registrar paciente | M |
| /pacientes/:id | Cabecera, alergias e historial; Nueva consulta entrega contexto a 002 | M |
| /notas/:id | Nota y versiones en solo lectura; Corregir pertenece a 005 | M |

## Sesión

Consumir login y me; enviar Bearer en peticiones clínicas. La guía establece
`vozclinica:token` en localStorage; este almacenamiento no es inmune a XSS.
No registrar tokens ni cuerpos clínicos, ni renderizar HTML arbitrario.
Sin token, redirigir a /login. Ante 401, borrar token y cachés clínicas de interfaz
y pedir acceso de nuevo; no reenviar escrituras automáticamente ni descartar
el borrador por una expiración de sesión.

Cerrar sesión busca claves `vozclinica:borrador:` y `vozclinica:correccion:`.
Si existen, ofrecer Seguir trabajando / Descartar y salir. Cancelar conserva sesión
y trabajo; confirmar elimina esas claves, token y cachés y vuelve al login.
Sin trabajo local salir directamente. El JWT emitido sigue válido hasta su
expiración; no existe endpoint logout ni revocación en el contrato del MVP.

## Lista y registro

Buscar por nombre, expediente o fecha; ignorar respuestas de peticiones anteriores
que lleguen fuera de orden. Mostrar carga, error, reintento y sin coincidencias.
No presentar un fallo de red como una lista vacía.
Al completar el alta, consultar coincidencias por nombre y por fecha, combinar por
id y mostrarlas antes del POST. Se puede abrir el expediente o elegir No es ninguno:
registrar nuevo. No añadir un endpoint ni un campo obligatorio para confirmación.
La fecha futura y datos mínimos vacíos impiden enviar; el servidor revalida.
El expediente asignado se muestra tras éxito, nunca se captura manualmente.

## Expediente y nota

Mostrar APELLIDOS, Nombre(s), sexo, edad, expediente, nacimiento y sangre si existe.
Alergias llevan icono/texto; Sin alergias conocidas usa estado neutro. El historial
muestra fecha, diagnóstico, médico, estado y versión; sin notas se indica el estado
vacío, sin confundir borradores con notas autorizadas. El detalle y versiones son
de solo lectura. PATCH S de ficha no habilita edición de identidad dentro de la nota.

## Presentación y accesibilidad

Etiqueta Datos ficticios visible. Fechas DD/mmm/AAAA, hora 24 h y edad calculada
con fecha local de calendario para no desplazar nacimiento por conversión UTC.
Validar WCAG 2.2 AA: etiquetas, errores textuales, teclado, foco visible, contraste
y estados con icono/texto además de color. Los diálogos contienen el foco y lo
restituyen al disparador al cerrar. No se agregan agenda ni nuevas pantallas de roles.
