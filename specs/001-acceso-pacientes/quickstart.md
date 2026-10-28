# Validación prevista — acceso y pacientes

El backend ya está implementado: 37 pruebas pasan sobre PostgreSQL 16 y se verificó
la API mediante HTTP real. Consulta [la evidencia](validation/jeroben.md) y la
[preparación reproducible](../../docs/DESARROLLO.md). El frontend y las notas de demo
con el esquema completo siguen pendientes; los comandos E2E son una guía futura.

## Prerrequisitos

- Python 3.12 y PostgreSQL 16 con permisos para crear base de pruebas y unaccent.
- Backend implementado con requirements fijados, migraciones y cargar_demo idempotente.
- Esquema clínico v1.1 compartido de 003/VC-01 para las notas sintéticas del historial.
- Variables DATABASE_URL, DJANGO_SECRET_KEY, ALLOWED_HOSTS y CORS_ALLOWED_ORIGINS
  configuradas de forma segura; no copiar valores al repo. DEBUG solo para desarrollo.
- Para interfaz: `frontend/` implementado en este repositorio, Node.js 22 LTS
  (>=22.12), npm, package-lock.json, URL de API y orígenes exactos autorizados.
  HTTPS en validación desplegada.
- No hacen falta ElevenLabs, Backboard ni n8n para esta funcionalidad.

## Preparación del backend implementado

Desde `/workspace/medproject`, con PostgreSQL disponible y variables ya configuradas:

```bash
python3 -m venv /workspace/.venvs/medproject
. /workspace/.venvs/medproject/bin/activate
cd /workspace/medproject/backend
python -m pip install -r requirements.txt
python manage.py check
python manage.py migrate
python manage.py cargar_demo
python manage.py cargar_demo
python manage.py test cuentas pacientes notas --verbosity 2
```

La segunda carga no debe duplicar médicos, pacientes ni notas ni sobrescribir cambios.
No usar --reiniciar como parte de esta validación. Ejecutar los tests con PostgreSQL,
no SQLite: unaccent, secuencias y concurrencia requieren el motor previsto.
El runner debe ejecutar pruebas reales y conservar su estado de salida; cero tests
no demuestra preparación. Los tests de 004/005 aún no existen en esta fase.

Para pruebas HTTP internas de desarrollo, iniciar en otra terminal con el entorno
activado y las mismas variables:

```bash
cd /workspace/medproject/backend
python manage.py runserver 127.0.0.1:8000
```

La dirección es únicamente para solicitudes internas. La aceptación de interfaz
usa el despliegue HTTPS; no se necesita crear un enlace de preview cloud.

## Casos automatizados que deben existir

| Caso | Acción | Resultado esperado |
|---|---|---|
| A01 | Login médico de demo válido y GET me | 200, access y perfil correcto |
| A02 | Contraseña inválida o usuario inactivo | 401, sin emisión de token |
| A03 | Cada operación clínica sin token, expirado o alterado | 401, sin lectura ni escritura |
| A04 | Usuario autenticado sin perfil médico | Acceso clínico denegado |
| P01 | Buscar García/garcia, expediente y nacimiento en ambos formatos | Coincidencias esperadas; lista sin paginación |
| P02 | Buscar sin coincidencias | 200 con lista vacía, distinto de error HTTP |
| P03 | Registrar datos mínimos, apellido materno ausente | 201, expediente del servidor y creado_por de sesión |
| P04 | Omitir cada campo obligatorio o usar nacimiento futuro | 400 con error de validación, sin alta |
| P05 | Enviar expediente o creado_por elegidos por cliente | Rechazo de campos ajenos al contrato, sin suplantación |
| P06 | Crear dos pacientes simultáneamente | 2 altas válidas con expedientes distintos; UNIQUE se conserva |
| P07 | Repetir carga de demo | Mismos conteos: 2 médicos y 6 pacientes documentados; notas sin duplicados |
| N01 | Consultar historial de paciente y detalle de nota | Fecha descendente, diagnóstico vigente y versiones descendentes |
| N02 | Consultar pacientes/notas inexistentes | 404 con error uniforme |
| N03 | Leer una nota y sus versiones | Ningún contenido o versión cambia; no hay rutas de escritura de notas en 001 |
| S01 | PATCH de ficha con mejora S implementada | 200 con cambios; expediente inmutable |

CA-08 completo (rechazar POST /api/notas sin JWT) se ejecutará al implementar 004;
A03 demuestra aquí la política de autenticación de las rutas ya disponibles.
Verificar cuerpos y status contra [OpenAPI](contracts/openapi.json). El objeto de
contenido clínico debe validarse además con el esquema compartido; esta API de
lectura deliberadamente no sustituye ese contrato.

## Preparación del frontend implementado

Desde una terminal con Node disponible y la URL de API configurada mediante
`VITE_API_URL` (valor público, sin secretos), se prevén estos scripts en package.json:

```bash
cd /workspace/medproject/frontend
npm ci
npm run test -- --run
npm run build
npx playwright install chromium
npm run test:e2e
```

`test:e2e` deberá iniciar la aplicación de pruebas mediante la configuración de
Playwright y usar el backend de demo configurado. No sustituir todas las pruebas
integradas por mocks: los casos de aceptación de acceso/pacientes usan PostgreSQL
y API reales. Los scripts y dependencias se crean en implementación; estos comandos
no están disponibles todavía. No se necesita otro checkout ni una raíz npm común.

## Validación de interfaz integrada

1. Entrar con un médico de demo, comprobar nombre/cédula y etiqueta Datos ficticios.
2. Buscar García y garcia; obtener la misma paciente y alergia a penicilina.
3. Iniciar registro parecido: comprobar aviso de coincidencias, abrir expediente y
   luego repetir el flujo eligiendo registrar un nuevo paciente ficticio.
4. Abrir expediente con notas; comprobar cabecera, historial y detalle completo.
   Cambiar de versión y verificar que no hay edición ni mutación de la anterior.
5. Repetir en un paciente sin notas y con búsqueda sin coincidencias.
6. Recorrer con teclado, comprobar etiquetas, foco, errores y contraste WCAG 2.2 AA;
   verificar que fechas de nacimiento no cambian al mostrarlas en México.
7. Con un borrador sintético local del contrato de 004, solicitar salida: cancelar
   conserva todo; Descartar y salir elimina token y borradores/correcciones. Probar
   expiración por separado: pide login sin descartar automáticamente el trabajo.
8. Simular error de red y respuestas fuera de orden de búsqueda; no mostrar datos
   viejos ni confundir fallo con un resultado vacío.

Mientras `frontend/` no esté implementado e integrado, estos pasos se reportan como
pendientes, aunque las pruebas de API pasen. Anotar comando, conteo de pruebas,
resultado, versión de código y dependencias. No presentar esta guía como una
prueba ejecutada ni el plan como una aplicación desplegada.
