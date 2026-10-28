# MedVox

Asistente de documentación clínica por voz (hackathon). Todos los datos son ficticios.
Backend Django en `backend/` y aplicación del médico en React en `frontend/`,
dentro de este mismo repositorio.

- [Requerimientos del MVP](docs/REQUERIMIENTOS.md).
- [Guías del equipo](docs/equipo/).
- [Frontend de referencia y configuración de la API](frontend/README.md).
- [Paquete para Lovable](docs/equipo/lovable/README.md): prompts, capturas, conocimiento del proyecto y backlog de Linear en CSV.
- [Preparar y ejecutar el backend](docs/DESARROLLO.md).
- [Especificaciones y reparto de tareas](specs/README.md).
- [Flujo de Spec Kit](docs/SPEC_KIT.md).

El backend de acceso y pacientes está implementado y probado con PostgreSQL 16.
El frontend de referencia puede usar mocks o conectar por recursos con la API;
la integración de ambos no está acreditada por las pruebas de backend.
La carga de notas ficticias depende del esquema clínico compartido de Luis;
se pueden probar acceso, búsqueda, registro y edición de pacientes mientras tanto.
