# Modelo de datos — acceso y pacientes

Estado: diseño previsto, sin migraciones creadas. Fuente principal: guía backend
§§6, 8 y 9. Identificadores internos enteros; fechas de calendario ISO y eventos
con zona horaria. Las columnas internas no se exponen automáticamente en la API.

## Usuario y Medico

Se usa User de Django para contraseña hasheada, usuario único y estado activo.
`Medico.usuario` es OneToOne protegido frente a eliminación, con `nombre_completo`
(200), `cedula_profesional` (20) y `especialidad` (100), todos obligatorios.
El médico autenticado debe existir y estar activo; un usuario sin perfil no recibe
acceso clínico. No hay registro público, roles nuevos ni necesidad de un User
personalizado; se elige antes de las migraciones iniciales.

JWT contiene la identidad técnica del usuario, no información clínica. Vigencia
12 horas conforme a la guía; no hay refresh ni tabla de sesión nueva.

## Paciente

| Campo | Regla | Exposición |
|---|---|---|
| id | Identificador interno | Solo lectura |
| numero_expediente | Único, formato `0000-0000`, inmutable | Solo lectura |
| nombres | Texto requerido, máximo 100; recortar espacios externos | Lectura / registro / PATCH S |
| apellido_paterno | Texto requerido, máximo 100 | Lectura / registro / PATCH S |
| apellido_materno | Máximo 100; ausencia normalizada a cadena vacía | Lectura / registro / PATCH S |
| fecha_nacimiento | Fecha válida, no futura | Lectura / registro / PATCH S |
| sexo | mujer / hombre / no_especificado | Lectura / registro / PATCH S |
| alergias | Texto requerido no vacío; Sin alergias conocidas se expresa explícito | Lectura / registro / PATCH S |
| tipo_sangre | Máximo 3, vacío permitido | Solo lectura en este contrato; sin editor nuevo |
| telefono | Máximo 20, opcional; null de entrada se normaliza a vacío interno | Lectura / registro / PATCH S |
| creado_por | Médico de la sesión, relación protegida | Interno; nunca tomado de la petición |
| creado_en | Fecha/hora del servidor | Interno |
| memoria_ref | Opcional, reservado a 006 | No se expone ni integra aquí |

`ultima_consulta` y `total_notas` son derivados de notas autorizadas/corregidas,
no campos editables. Sin notas: null y 0. Orden y conteo usan la nota, no cada
versión por separado. Edad se calcula en la interfaz, no se persiste.

## Asignador de expediente

Decisión técnica propuesta: secuencia PostgreSQL con inicio en 48300. Su
inicialización idempotente se completa antes de aceptar registros, queda por encima
del máximo importado y no rebobina un valor ya utilizado. La creación obtiene el
siguiente valor y lo formatea con ocho dígitos y guion central, manteniendo UNIQUE
en Paciente. No se permite desbordamiento silencioso. Se admiten huecos tras rollback.
No se usa MAX+1 sin exclusión mutua. Las pruebas ejecutan creaciones simultáneas
sobre PostgreSQL y verifican expedientes distintos.

## Lectura compartida: Plantilla, Nota y VersionNota

- Plantilla: clave, versión, esquema y activa; unicidad de clave/versión.
- Nota: paciente y médico protegidos, plantilla, fecha/hora de atención,
  tipo primera_vez/seguimiento, modo dictado/consulta, consentimiento,
  estado autorizada/corregida, versión vigente y fecha de creación.
- VersionNota: nota, número positivo, contenido según la plantilla, transcripción
  opcional, médico autorizante, fecha/hora y motivo. Unicidad de nota/número;
  versiones inmutables. El motivo es obligatorio desde la versión 2.

`diagnostico_principal` viene de la primera descripción diagnóstica de la versión
vigente, o null. El historial ordena fecha/hora descendente, con id como desempate
estable. El detalle incluye versiones en número descendente y nunca expone audio.
La plantilla y el contenido completo deben alinearse con 003 antes de precargar
notas; aquí no se redefine el inventario clínico de REQUERIMIENTOS §7.

No se crean tablas de borradores o audio. En esta fase no hay endpoints para crear,
actualizar o borrar notas/versiones. Las fixtures sintéticas inicializan datos
mediante un comando administrativo de demo, no mediante autorización simulada
expuesta a usuarios. No se ofrece `--reiniciar` destructivo en el flujo normal.

## Estados y relaciones

- Médico autenticado → búsquedas, registro, expediente y lectura de notas.
- Registro válido → paciente con expediente único; registro inválido → sin alta.
- Posibles duplicados → abrir existente o confirmar nuevo; no son un bloqueo
  automático ni implican unicidad de nombre/fecha.
- Nota autorizada → consulta de versión vigente y versiones previas inmutables.
- Sesión local → salida confirmada elimina token y trabajo local; no cambia notas.

El MVP tiene un único conjunto de pacientes de demostración para médicos
precargados, coherente con notas de distintos médicos en un mismo expediente.
`creado_por` registra procedencia, no introduce aislamiento por propietario.
No se deduce un permiso de acceso anónimo ni un sistema multiinstitución.
