# MedVox

Asistente de documentación clínica por voz (hackathon). Todos los datos son ficticios.
Backend Django en `backend/` y aplicación del médico en React en `frontend/`,
dentro de este mismo repositorio.

- [Requerimientos del MVP](docs/REQUERIMIENTOS.md).
- [Guías del equipo](docs/equipo/).
- [Frontend de referencia y configuración de la API](frontend/README.md).
- [Paquete para Lovable](docs/equipo/lovable/README.md): prompts, capturas, conocimiento del proyecto y backlog de Linear en CSV.
- [Preparar y ejecutar el backend](docs/DESARROLLO.md).
- [Desplegar el backend en un Droplet de DigitalOcean](docs/DIGITALOCEAN.md).
- [Especificaciones y reparto de tareas](specs/README.md).
- [Acceso de médicos con MojoAuth](docs/MOJOAUTH.md).
- [Flujo de Spec Kit](docs/SPEC_KIT.md).

El backend de acceso y pacientes está implementado y probado con PostgreSQL 16.
El frontend de referencia puede usar mocks o conectar por recursos con la API;
la integración de ambos no está acreditada por las pruebas de backend.
La carga administrativa de demo usa el esquema clínico compartido de Luis:
dos médicos, seis pacientes y cinco notas con seis versiones. Repetirla conserva
los datos existentes. Se pueden probar acceso, pacientes, historial y lectura de
versiones, procesar audio con `POST /api/ia/procesar` (configuración en
[DIGITALOCEAN.md](docs/DIGITALOCEAN.md#procesamiento-de-audio-ia)) y autorizar
notas nuevas con `POST /api/notas`; las correcciones (nuevas versiones) se
integrarán en la siguiente fase.
