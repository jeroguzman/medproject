# MedVox · conocimiento del proyecto

Asistente de documentación clínica por voz para médicos en México (hackathon). El médico graba la consulta o dicta, la IA transcribe y prellena el Formato Clínico General, el médico revisa y autoriza. Solo la nota autorizada entra al expediente. Todos los datos son ficticios.

## Reglas que nunca se rompen
1. Nada clínico sale del navegador hasta que el médico autoriza. El borrador vive solo en localStorage ("medvox:borrador:<pacienteId>"; la corrección en "medvox:correccion:<notaId>"). El audio vive solo en memoria y nunca se guarda en localStorage.
2. No uses Supabase, Lovable Cloud ni autenticación de Lovable. Todo va contra la API REST de Django mediante src/api/cliente.ts. Ninguna clave de API va en el frontend.
3. La identificación del paciente (nombre, expediente, nacimiento, sexo, médico y cédula) es de solo lectura: viene de la API.
4. Un campo vacío no es un "no": se muestra "— Sin información" en gris; "Negado" es un estado distinto y se ve distinto.
5. Corregir no sobrescribe: cada corrección autorizada es una versión nueva; las anteriores se consultan en solo lectura.
6. La IA es un asistente de documentación: no diagnostica, no prescribe y no sugiere.

## Archivos base: no los reescribas
Estos archivos ya existen y son contrato con el backend y la IA. Impórtalos; no los muevas, no los renombres y no cambies su lógica salvo que te lo pida explícitamente:
- src/config.ts (API_URL, USAR_MOCKS, LIMITES, CLAVES_STORAGE)
- src/api/cliente.ts, tipos.ts, consultas.ts (hooks de TanStack Query) y mocks.ts
- src/mocks/*.json (datos de ejemplo)
- src/plantilla/formatoClinicoGeneral.ts y valores.ts
- src/lib/formatos.ts, contenido.ts, fusion.ts, alertas.ts, vitales.ts, evidencia.ts, borrador.ts, navegacion.ts
- src/hooks/useDocumentoLocal.ts, useGrabadora.ts, useAvisoAlSalir.ts, useTitulo.ts, useAlto.ts
- src/styles/tokens.css y ds.css (Design System Clínico v0.4)
- src/components/ui/Logo.tsx, public/favicon.svg y public/marca/*.svg (logotipo de MedVox)
Si algo de estos archivos no te sirve, dímelo en lugar de cambiarlo.

## Interfaz
- Español de México, tratando de "tú" al médico. Escritorio primero: 1366 × 768.
- Usa las clases del DS de src/styles/ds.css (btn, field, input, seg, alert, badge, pb, vstatus, tabs, steps, dlg, empty, dtable, card, t-*). Escribe siempre la clase completa ("b-info"), nunca armada con plantillas.
- Un solo botón primario por pantalla. El rojo solo para lo crítico (alergias, errores, acciones destructivas). Todo estado con color, icono y palabra juntos. Foco visible de 3 px. Iconos lucide de 16, 20 y 24 px. Texto base de 16 px; ningún dato clínico por debajo de 14 px. Controles de 40 px.
- Diálogos con el <dialog> nativo: el título es la pregunta, el cuerpo la consecuencia y los botones repiten el verbo ("Seguir editando" / "Autorizar nota"); nunca "Sí / No" ni "Aceptar".
- Estados vacíos que dicen qué aparecerá y cómo empezar; carga con esqueletos, nunca un spinner a pantalla completa.
- Etiqueta fija "Datos ficticios" en todas las pantallas.
- Marca: el nombre oficial es MedVox. Usa <Logo className="h-8" /> (la altura va en className): cambia solo entre la versión clara, la oscura y la monocroma de impresión. No dibujes el logotipo con iconos ni texto.

## Formatos (usa src/lib/formatos.ts)
- Fecha DD/mmm/AAAA ("12/mar/1992"): formatearFecha. Nunca new Date("AAAA-MM-DD").
- Hora siempre de 24 h. Fecha y hora: formatearFechaHora ("28/oct/2026 · 10:52").
- Edad: formatearEdad (años; meses si < 2 años; días si < 1 mes).
- Nombre en cabecera y listas: nombreCabecera ("GARCÍA LÓPEZ, María Fernanda").
- Punto decimal y unidad siempre con la cifra ("38.4 °C"). Expedientes y cédulas en fuente mono.

## Vocabulario
- El verbo es "Autorizar", nunca "Firmar".
- Estados de la nota: Borrador (solo en el navegador) → Autorizada (v1) → Corregida · vN.
- Origen de cada campo: "IA" (insignia b-info), "Editado" (b-neutral); lo manual no lleva insignia.
- Modos de captura: Dictado y Consulta. En Consulta hace falta "El paciente autorizó la grabación".

## Integraciones (siempre a través de la API de Django)
- ElevenLabs Scribe, n8n y backboard.io: los usa Django dentro de POST /api/ia/procesar. El frontend solo envía el audio.
- Pregúntale al expediente (Backboard): POST /api/pacientes/{id}/preguntar, solo con notas autorizadas.
- Referencias de apoyo (Tavily): GET /api/referencias?termino=. Solo viaja el término, nunca datos del paciente.
- Reportar error de la IA (Linear): POST /api/ia/reportar-error con { campo, motivo }. Sin texto clínico.

## Datos de ejemplo
Con USAR_MOCKS, src/api/mocks.ts simula toda la API. Usuario pmendez o esalas, contraseña demo1234. Para reiniciar los datos: abrir /?reiniciar-mocks antes de iniciar sesión.
