# Investigación y decisiones — acceso y pacientes

Investigación documental del repositorio, 2026-10-28. No se ha instalado ni probado
el stack de la aplicación. Se revisaron REQUERIMIENTOS §§6, 9, 11, 12, 16 y las
guías backend §§6–9 y frontend §§6–7. Las elecciones siguientes son diseño propuesto,
no un cambio de acuerdos de producto. No quedan incógnitas técnicas sin valor de
trabajo que impidan elaborar tareas de esta funcionalidad.

## 1. Usuario y perfil

**Decisión:** User de Django y Medico OneToOne, antes de las primeras migraciones.
**Razón:** coincide con el modelo explícito de la guía backend y conserva identidad
profesional separada de credenciales. Requerimientos dice «extiende» sin exigir un
modelo de autenticación propio.
**Alternativa:** custom User; no aporta una necesidad documentada al MVP.

## 2. Autenticación, salida y acceso compartido

**Decisión:** SimpleJWT, acceso de 12 horas sin refresh. Login conserva los nombres
usuario/contrasena y devuelve access/medico. Logout borra sesión local; con borradores
pide confirmación y elimina el trabajo solo si se elige Descartar y salir. La
expiración/401 pide acceso de nuevo y no descarta automáticamente borradores.
**Razón:** corresponde al contrato y a la guía frontend. No hay revocación de token
remota documentada. No se registra un endpoint logout ficticio.
**Alternativas:** cookies HttpOnly, refresh/blacklist; mejoras futuras que cambiarían
el contrato del MVP. LocalStorage conserva el riesgo ante XSS, por lo que no se
renderiza HTML clínico arbitrario ni se registran tokens.

**Decisión:** toda operación clínica requiere usuario activo con perfil médico.
Los médicos de demo acceden al conjunto compartido, sin tenancy añadida.
**Razón:** un mismo expediente de demo tiene notas de dos médicos. `creado_por`
registra autoría, no limita el expediente a su creador.
**Alternativa:** aislamiento por médico; alteraría el flujo documentado.

## 3. Búsqueda y coincidencias

**Decisión:** PostgreSQL real y extensión unaccent creada por migración. Buscar
nombres/apellidos sin acentos ni mayúsculas y expediente; reconocer fechas ISO o
DD/MM/AAAA para igualdad con nacimiento. Lista sin paginación.
**Razón:** la guía backend define explícitamente esta semántica y el pequeño volumen.
**Alternativas:** normalización manual persistida o motor de búsqueda externo;
introducen sincronización o infraestructura no necesaria. SQLite no valida unaccent.

**Decisión:** coincidencias informativas en alta, reutilizando q por nombre/fecha
y combinando por id. Permitir abrir expediente existente o confirmar paciente nuevo.
**Razón:** los homónimos son posibles; no existe unicidad por nombre/fecha ni endpoint
de duplicados en las fuentes.
**Alternativa:** bloquear altas similares; produce falsos positivos y cambia RF-04.

## 4. Expediente concurrente

**Decisión:** secuencia PostgreSQL iniciada en 48300 para los pacientes nuevos,
formato 0004-8300, con UNIQUE en numero_expediente. Inicializar de manera idempotente
por encima del máximo importado antes de habilitar registros, sin rebobinar una
secuencia usada; respetar el límite de ocho dígitos. Admitir huecos tras rollback.
**Razón:** max+1 sin bloqueo, sugerido por la guía, puede colisionar. Una secuencia
resuelve concurrencia sin otra entidad de negocio. No se exige numeración sin huecos.
**Alternativas:** contador con select_for_update funciona pero añade estado/filas;
max+1 sin exclusión mutua se descarta. No cambia el formato externo documentado.

## 5. Lectura clínica y fixtures

**Decisión:** incluir lectura de notas y versiones en 001; reservar las escrituras
para 004/005. Reutilizar los modelos compartidos de la guía y precargar notas
sintéticas válidas con el esquema que se entregará en 003/VC-01.
**Razón:** RF-07 exige detalle completo, no solo resumen; el esquema clínico es
compartido y no debe inventarse otra forma para demostrar historial.
**Alternativas:** esperar a toda la autorización bloquea innecesariamente la lectura;
una tabla de notas resumidas duplicaría la fuente de verdad.

El comando cargar_demo debe poder repetirse sin duplicados ni sobrescribir datos
existentes. No ejecutar --reiniciar como paso normal. La inmutabilidad clínica no
se evita mediante un endpoint de reset. No hay integración IA necesaria para login,
búsqueda o alta; los fixtures de notas sí requieren el contrato de plantilla válido.

## 6. Versiones técnicas y fronteras

**Decisión:** Python 3.12, Django 5.2 LTS y PostgreSQL 16 como baseline propuesto;
resolver versiones exactas compatibles de DRF/SimpleJWT y fijarlas al implementar.
**Razón:** satisface Django>=5.1 de la guía sin elegir una versión no fijada para cada
reconstrucción. Frontend conserva el stack React/TypeScript/Vite y bibliotecas de
la guía, alojado en `frontend/` de medproject por instrucción explícita del usuario.
Node.js 22 LTS (>=22.12), npm con lockfile, Vitest y Playwright son el baseline
propuesto; las versiones exactas se resuelven y validan al implementar.
**Alternativas:** actualizar al último major sin probar compatibilidad o fijar aquí
versiones de dependencias aún no instaladas; no aporta evidencia de funcionamiento.

P-01 usa la recomendación vigente; P-05 no requiere seleccionar hosting para diseñar
esta API. Antes de despliegue hacen falta proveedor, base PostgreSQL con permiso
unaccent, dominio exacto del frontend y configuración segura. No se necesita otro
repositorio: la decisión explícita del usuario reemplaza §9.6 para ubicar el frontend
en `frontend/`. Alternativa descartada: repositorio Lovable separado, por esa
instrucción. No se han pedido credenciales ni creado integraciones.
