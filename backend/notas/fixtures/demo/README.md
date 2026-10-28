# Notas ficticias de demostración

Cinco notas y seis versiones, con una nota corregida que conserva su versión 1.
Los pacientes, médicos y fechas siguen la guía de backend §9. Los textos clínicos
son sintéticos y no constituyen recomendaciones de atención o tratamiento.

Cada contenido incluye todas las secciones/campos del esquema compartido de Luis.
Los datos capturados tienen origen manual; los campos sin datos conservan
sin_informacion. No se inventa una transcripción ni evidencia de audio para estas
notas históricas manuales.

La carga administrativa `python manage.py cargar_demo` valida el esquema y todas
las notas antes de escribir. Se ejecuta dentro de una transacción y un bloqueo
administrativo. La identidad de una nota se reconoce por paciente, médico,
plantilla, fecha y hora. Si ya existe, se conserva por completo, incluso si recibió
correcciones posteriores. No se reinician datos ni contraseñas. Una plantilla
existente con la misma versión pero distinto esquema bloquea la carga y no se
reemplaza silenciosamente.

Esta carga de fixtures no crea una ruta de autorización para usuarios: las APIs
clínicas de escritura siguen perteneciendo a 004/005.
