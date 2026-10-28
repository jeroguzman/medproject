# Frontend con Lovable: paquete de prompts

> Para German (rol A). Con esto se reconstruye en **Lovable** la interfaz de referencia que está en [`frontend/`](../../../frontend/), usando las integraciones del evento. Reemplaza los prompts de la [§6 de tu guía](../german-frontend.md): son los mismos pasos, pero con el detalle exacto de lo que ya probamos.

## 1. Cómo se reparte el trabajo

| Parte | Quién la hace | Por qué |
|---|---|---|
| **Toda la UI**: pantallas, componentes, distribución y estados | **Lovable**, con los prompts de la §4 y las capturas de [`capturas/`](capturas/) como referencia visual | Es lo que pide el evento |
| **Cimientos** (sin pantallas): config, cliente de la API, datos de ejemplo, plantilla, reglas (fusión, origen, obligatorios, alertas, signos vitales, formatos), hooks del borrador y de la grabadora, tokens del DS | Se suben al repo de Lovable por GitHub (§3) | Son contrato con Luis y Jeroben y ya pasan 25 pruebas. Pedírselos a Lovable con prompts gasta créditos y arriesga errores en las reglas clínicas |
| ElevenLabs, n8n y backboard.io (extracción) | Luis y Jeroben, en el backend | El frontend nunca tiene claves; solo llama a Django |

Si las reglas del evento piden que **todo** el código salga de Lovable, usa la §6 en lugar de la §3.

## 2. Antes de empezar

- Abre la app de referencia para comparar mientras trabajas:

```bash
git clone -b claude/prompts-lovable https://github.com/jeroguzman/medproject.git
```
```bash
cd medproject/frontend && npm install && npm run dev
```

  Se abre en http://localhost:8080 con datos de ejemplo (usuario `pmendez`, contraseña `demo1234`).
- **Un prompt a la vez.** Revisa la vista previa con la lista "Revisa" de cada prompt antes de seguir.
- **Adjunta las capturas que indica cada prompt** (botón de adjuntar o arrastrándolas al chat; hasta 10 por mensaje) y deja claro que son **referencia de diseño**, no imágenes para insertar. Todos los prompts ya lo dicen.
- Si Lovable propone **Supabase o Lovable Cloud**, recházalo: "No uses Supabase ni Lovable Cloud; todo va contra la API REST de Django".
- Si Lovable modifica un archivo de cimientos, pídele que lo revierta o recupéralo desde el historial de versiones (o desde GitHub).
- **No uses el modo Plan para ahorrar**: cobra 1 crédito por mensaje. Para preguntas y diagnósticos usa el modo **Chat**, que entra en la cuota diaria gratuita de chat. Usa Build solo para aplicar cambios. Lee la §2.1 antes de empezar.

### 2.1 Presupuesto de créditos

Lovable cobra cada mensaje de Build según el trabajo que hace (archivos tocados y código escrito), aunque el resultado no funcione. Como referencia, su documentación pone 0.5 créditos para cambiar el color de un botón, 1.2 para agregar autenticación y unos 2 para una landing page completa. Con eso y el tamaño de cada pantalla de la app de referencia, esta es la estimación. **Es aproximada: mídela tú después de los prompts 1 a 3.**

| Prompts | Prioridad | Créditos estimados |
|---|---|---|
| 1 base, 2 design system, 3 login y layout | M | 3 a 5 |
| 4 pacientes, 5 expediente | M | 2.5 a 4 |
| 6 consulta y formulario | M | 3 a 5 |
| 7 borrador, 8 grabadora | M | 2 a 3.5 |
| 11 autorizar, 12 nota y versiones, 13 corrección | M | 4 a 7 |
| 9 evidencia, 10 alertas, 14 impresión, 15 Backboard | S | 4 a 7 |
| 16 Tavily, 17 Linear | C | 1 a 2 |
| **Total sin correcciones** | | **20 a 33** |

Solo lo M (la demo completa) cuesta entre 15 y 25 créditos. Todo, con correcciones (cuenta un 30 a 50 % más), queda entre 26 y 50. Con 40 créditos más 5 diarios **lo M alcanza de sobra; todo alcanza solo si los prompts salen bien a la primera o la segunda**. Reglas para que alcance:

1. **Orden por prioridad:** primero lo M en este orden: 1, 2, 3, 4, 5, 6, 7, 8, 11, 12 y 13. Eso ya es la demo completa (CA-01 a CA-10). Después lo S (9, 10, 14, 15) y al final lo C (16, 17).
2. **Mide después del prompt 3.** Si esos tres costaron más de 6 créditos, el total se va arriba de 45: aplica la regla 5 desde el prompt 12.
3. **Gasta primero los 5 créditos diarios**, que no se acumulan. Si el evento dura varios días, reparte el trabajo para aprovechar los de cada día.
4. **Arregla lo pequeño a mano:** textos, colores o una clase se cambian sin IA en el editor de código de Lovable (modo Dev, incluido en Pro) o subiendo el cambio a GitHub (`main`). Pregunta en modo Chat qué archivo tocar.
5. **Regla de dos intentos:** si un prompt falla dos veces, no lo intentes una tercera. Copia el componente equivalente de `frontend/src/` al repo de Lovable por GitHub y sigue con el siguiente prompt (§8).
6. **No reenvíes un prompt completo para corregir.** Describe solo lo que falla ("En la pestaña Referencias el botón Buscar no hace nada") y adjunta una captura de tu vista previa.

## 3. Preparar el proyecto (una sola vez)

**Paso 1. Crear el proyecto con el prompt 1** (§4). Lovable crea el proyecto con el primer mensaje.

**Paso 2. Conectar GitHub.** En el proyecto de Lovable, abre la integración con GitHub (botón de GitHub o *Settings → GitHub*), autoriza la app de Lovable y crea el repositorio. Nombre sugerido: `medproject-frontend`. La sincronización es en los dos sentidos **solo con la rama principal (main)**: lo que subas a `main` aparece en Lovable.

**Paso 3. Subir los cimientos** desde tu computadora:

```bash
git clone https://github.com/<tu-cuenta>/medproject-frontend.git
```
```bash
medproject/docs/equipo/lovable/copiar-cimientos.sh medproject-frontend
```
```bash
cd medproject-frontend && git add src && git commit -m "Agregar cimientos de VozClínica" && git push origin main
```

Revisa en Lovable (vista de código) que aparezcan `src/api/`, `src/lib/`, `src/hooks/`, `src/mocks/`, `src/plantilla/` y `src/styles/`. Son 29 archivos; la lista está en [`copiar-cimientos.sh`](copiar-cimientos.sh).

**Paso 4. Conocimiento del proyecto.** En *Project settings → Knowledge*, pega el contenido de [`conocimiento.md`](conocimiento.md). Lovable lo toma en cuenta en cada mensaje: reglas, archivos que no debe tocar, formatos y vocabulario.

**Paso 5. Seguir con los prompts 2 a 17.**

**Cuando la API de Jeroben esté lista:** en `src/config.ts` cambia `API_URL_PROYECTO` a la URL de la API (sin diagonal final) y `USAR_MOCKS_PROYECTO` a `"false"`. Para pasar pantalla por pantalla, deja en `USAR_MOCKS_PROYECTO` los recursos que siguen con datos de ejemplo, por ejemplo `"ia,notas"`. Puedes editarlo en la vista de código o pedírselo a Lovable con esas palabras. En Lovable no hay archivo `.env` sin Lovable Cloud, por eso van en el código; la URL de la API no es secreta.

**Dominios para CORS:** pásale a Jeroben el dominio de la vista previa (abre la vista previa en otra pestaña y copia el origen de la barra de direcciones) y el publicado (`https://<nombre>.lovable.app`, después de *Publish*). Los dos son HTTPS, así que el micrófono funciona.

## 4. Prompts

Cada prompt lleva: qué adjuntar, el texto para pegar tal cual y qué revisar en la vista previa.

### Prompt 1 · Proyecto base

Adjunta: nada.

```text
Crea una aplicación web llamada VozClínica: asistente de documentación clínica por voz para médicos en México. Es para un hackathon y todos los datos son ficticios.

Stack: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + lucide-react + react-router-dom + @tanstack/react-query + sonner.
IMPORTANTE: no uses Supabase, ni Lovable Cloud, ni autenticación de Lovable, ni ningún backend propio. Todos los datos vienen de una API REST externa (Django). En el siguiente paso subiré por GitHub la capa de datos ya hecha.

Por ahora solo:
1. Rutas con react-router: /login, /pacientes, /pacientes/:id, /pacientes/:id/consulta, /notas/:id, /notas/:id/corregir y /notas/:id/imprimir, cada una con una página vacía que diga su nombre. "/" redirige a /pacientes. Una página 404 "No encontramos esta página" con enlace a /pacientes.
2. Toda la interfaz en español de México, tratando de "tú" al usuario. Diseño primero para escritorio de 1366 × 768.
3. Una etiqueta pequeña fija abajo a la izquierda con un icono de matraz (FlaskConical) y el texto "Datos ficticios", visible en todas las pantallas y oculta al imprimir.
4. QueryClientProvider con staleTime de 30 s y sin recargar al enfocar la ventana, y el Toaster de sonner abajo al centro con richColors y botón de cerrar.
5. En index.html: lang="es-MX", título "VozClínica" y las fuentes de Google "Atkinson Hyperlegible Next" (pesos 400 a 700) y "Atkinson Hyperlegible Mono" (pesos 400 a 600).
No agregues datos de ejemplo ni pantallas todavía.
```

Revisa: las rutas abren su página vacía y no hay nada de Supabase en el proyecto. **Además, sin gastar créditos**, abre la vista de código y revisa `package.json`: anota si `tailwindcss` es versión 3 (hay un `tailwind.config.ts` y `index.css` empieza con `@tailwind base`) o versión 4 (`index.css` empieza con `@import "tailwindcss"`). El prompt 2 cambia según la versión.

Después de este prompt, haz los pasos 2 a 4 de la §3.

### Prompt 2 · Design system y componentes base

Adjunta: `p06-formulario-lleno.png` y `p04-pacientes.png`.

```text
Ya subí por GitHub los archivos base en src/ (config, api, mocks, plantilla, lib, hooks y styles). Son contrato con el backend: no los reescribas ni los muevas; impórtalos. Las imágenes adjuntas son la referencia de diseño de la app terminada; no las insertes en la página.

1. En src/index.css agrega al inicio, antes de las directivas @tailwind:
   @import "./styles/tokens.css";
   @import "./styles/ds.css";
   Quita las variables HSL de :root y .dark que generó shadcn: tokens.css ya define --background, --foreground, --primary, --border, --ring, --radius, etc. con colores completos (hexadecimales), y también el modo oscuro.
2. En tailwind.config.ts: cambia cada color "hsl(var(--x))" por "var(--x)" (porque los tokens ya son colores completos), agrega los colores del bloque de abajo, la fuente sans "Atkinson Hyperlegible Next" y la mono "Atkinson Hyperlegible Mono", y este safelist para que Tailwind no quite las clases del DS: safelist: [{ pattern: /^(btn|b|alert|badge|seg|msg|vstatus|s|is|pb|t)-/ }]. Conserva tailwindcss-animate.
   (Si el proyecto usa Tailwind v4 en lugar de los pasos 1 y 2: en src/index.css agrega justo después de @import "tailwindcss"; las líneas @import "./styles/tokens.css"; y @import "./styles/ds.css";, quita las variables de :root y .dark que generó shadcn porque tokens.css ya las define con colores completos, conserva el bloque @theme inline de shadcn y agrega ahí --font-sans y --font-mono con las fuentes Atkinson. No hace falta safelist ni el bloque de colores: para los colores propios del DS usa valores arbitrarios, por ejemplo bg-[var(--color-banner-bg)].)
3. Usa las clases del Design System de src/styles/ds.css en lugar de estilos propios:
   botones btn + btn-primary | btn-secondary | btn-ghost | btn-critical | btn-critical-ghost, btn-sm, btn-icon, btn-block;
   campos field, field-label, req, field-opt, input, textarea, input-wrap, unit, lead-ic, help, msg + msg-error | msg-warning | msg-info, counter;
   segmentado seg (label con un input radio dentro y un icono Check con clase seg-ic), seg-sm;
   alertas alert + alert-critical | alert-warning | alert-success | alert-info, con alert-title, alert-body y alert-actions;
   insignias badge + b-neutral | b-action | b-info | b-success | b-warning | b-critical | b-draft;
   cabecera de paciente pb-wrap, pb, flush, pb-id, pb-av, pb-name, pb-sub, pb-meta, pb-alert, pb-neutral;
   signos vitales vstatus + s-ok | s-warn | s-crit | s-err | s-empty, calc, y en el contenedor is-warning | is-critical | is-error;
   historial tl; pestañas tabs (con count); índice steps, step, step-dot, done; diálogos dlg, dlg-lg y dlg-actions sobre <dialog>; vacío empty; esqueleto sk; tabla dtable; tarjeta card;
   tipografía t-title-lg, t-title-md, t-title-sm, t-body, t-body-sm, t-label, t-caption, mono y tnum.
   Escribe siempre la clase completa (por ejemplo "b-info"), nunca armada con plantillas.
4. Crea en src/components/ui estos componentes con esas clases:
   - Aviso: variante critical | warning | success | info, título, cuerpo y acciones; icono OctagonAlert, AlertTriangle, CheckCircle2 o Info; role="alert" en critical y role="status" en las demás.
   - Insignia: variante, icono de lucide opcional y texto.
   - Segmentado: fieldset con legend (puede ser solo para lectores de pantalla), radios dentro de label, icono Check visible en la opción elegida, prop chico (seg-sm) y deshabilitado.
   - Dialogo: <dialog> nativo con showModal(); Esc y clic fuera llaman onCerrar; título (la pregunta), cuerpo (la consecuencia) y botones a la derecha; role="alertdialog" para confirmaciones.
   - Esqueleto (barras sk con la forma del contenido, aria-busy) y Vacio (icono, título, texto y acción).
5. Reglas del DS: un solo botón primario por pantalla; el rojo solo para lo crítico; todo estado con color, icono y palabra juntos; foco visible de 3 px; iconos de 16, 20 y 24 px; texto base de 16 px y ningún dato clínico por debajo de 14 px; controles de 40 px.
No cambies las pantallas todavía.

Bloque de colores para theme.extend.colors (const v = (n: string) => `var(--${n})`):
[PEGA AQUÍ EL BLOQUE DE LA §4.1 DE docs/equipo/lovable/README.md]
```

Revisa: la letra ya es Atkinson, el fondo es gris verdoso claro y los botones de shadcn se ven verde azulado (`--color-action`).

### Prompt 3 · Inicio de sesión y layout

Adjunta: `p03-login.png`, `p04-pacientes.png` y `p03-cerrar-sesion.png`.

```text
Construye el inicio de sesión y el layout autenticado. Usa los archivos base; no reescribas su lógica. Las capturas son la referencia de diseño.

Inicio de sesión (/login), como en p03-login:
- Tarjeta centrada de 384 px con sombra: cuadro verde (--color-banner-bg) con el icono Stethoscope, "VozClínica" y el lema "Menos tiempo escribiendo, más tiempo atendiendo."
- Campos "Usuario" (name="username", autocomplete="username", sin mayúscula automática) y "Contraseña" (type="password", autocomplete="current-password"). Se permite pegar y usar gestores de contraseñas.
- Botón primario de ancho completo "Iniciar sesión" con icono LogIn; mientras envía dice "Entrando…".
- Al enviar: iniciarSesion(usuario, contrasena) de src/api/consultas.ts, guardarToken(r.access), queryClient.setQueryData(claves.medico, r.medico) y navega a location.state.desde o a /pacientes.
- Errores en un Aviso crítico "No pudiste entrar": con ErrorApi de estado 401, "Usuario o contraseña incorrectos."; si faltan datos, "Escribe tu usuario y tu contraseña."; si no, mensajeDeError(error).
- Con ?sesion=expirada en la URL: Aviso info "Tu sesión terminó · Vuelve a iniciar sesión. Tu borrador sigue guardado en este equipo."
- Si USAR_MOCKS es true, texto pequeño abajo: "Modo de datos de ejemplo: usuario pmendez o esalas, contraseña demo1234." (usuarios y contraseña en mono).
- Si ya hay token (leerToken()), redirige a /pacientes.

Rutas protegidas: componente RutaProtegida que, sin token, redirige a /login guardando la ruta en state.desde. /notas/:id/imprimir es protegida pero sin layout.

Layout autenticado (AppLayout), como en p04-pacientes:
- Barra superior fija de 48 px (surface, borde inferior): a la izquierda el cuadro verde con Stethoscope y "VozClínica" (enlace a /pacientes); a la derecha el nombre del médico en negritas (useMedico()), " · Céd. " y la cédula en mono, y el botón fantasma chico "Cerrar sesión" con icono LogOut.
- Navegación lateral fija de 208 px con el enlace "Pacientes" (icono Users); el activo con fondo --color-action-subtle y texto --color-action-text.
- En /pacientes/:id/consulta y /notas/:id/corregir la navegación se reduce a un riel de 88 px con el icono arriba y la etiqueta abajo.
- Enlace "Saltar al contenido" visible solo con teclado. Al cambiar de ruta, la página vuelve arriba (con un useEffect de bloque que no devuelva nada).
- Cerrar sesión: si hayTrabajoSinAutorizar() es true, abre el diálogo de p03-cerrar-sesion: título "¿Cerrar sesión?", cuerpo "Tienes un borrador sin autorizar. Si cierras sesión se pierde.", botones "Seguir trabajando" (secundario) y "Descartar y salir" (btn-critical, que llama descartarTodoElTrabajo()). Al salir: borrarToken(), queryClient.clear() y navegar a /login.
- Títulos de pestaña con useTitulo ("Pacientes · VozClínica").
```

Revisa: entra con `pmendez` / `demo1234`; con otra contraseña aparece el error; el nombre de la doctora sale arriba.

### Prompt 4 · Pacientes y registro

Adjunta: `p04-pacientes.png`, `p04-registro-duplicado.png` y `p04-registro-validacion.png`.

```text
Pantalla /pacientes (p04-pacientes) y registro de paciente (p04-registro-*). Las capturas son la referencia de diseño.

Lista:
- Título "Pacientes", subtítulo "Busca por nombre, expediente o fecha de nacimiento." y a la derecha el botón primario "Registrar paciente" (icono UserPlus).
- Buscador de 576 px con lupa dentro (input-wrap + lead-ic), placeholder "GARCÍA, 0004-8217 o 12/03/1992" y foco al entrar. Espera 250 ms después de escribir y usa usePacientes(q).
- Tabla dtable: Paciente (nombreCabecera, en negritas, como enlace), Sexo (textoSexo), Edad (formatearEdad(fecha, undefined, true), por ejemplo "34 a"), Expediente (mono) y Última consulta (formatearFecha). Toda la fila abre /pacientes/:id. Si existeBorrador(p.id), insignia b-draft "Borrador" junto al nombre.
- Carga con Esqueleto; error con Aviso crítico "No se pudo cargar la lista"; vacío con Vacio: "Ningún paciente coincide" ("No encontramos «…». Revisa la escritura o registra al paciente.") o "Aún no hay pacientes", con el botón secundario "Registrar paciente".

Diálogo "Registrar paciente" (dlg-lg, role="dialog"):
- Texto: "Lo mínimo para abrir el expediente. El número de expediente lo asigna el sistema."
- Fila de 3: Nombre(s)*, Apellido paterno* y Apellido materno (con "opcional" en gris).
- Fila de 2: Fecha de nacimiento* y Sexo*.
  - Fecha: componente CampoFecha de texto con placeholder "DD/mmm/AAAA". Acepta "12/mar/1992", "12/03/1992" o "1992-03-12" con leerFechaUsuario; al salir del campo lo reescribe con formatearFecha; debajo muestra "12/mar/1992 · 34 años". No acepta fechas futuras ("La fecha no puede ser futura."); si no la entiende: "Escribe la fecha como 12/mar/1992 o 12/03/1992."
  - Sexo: Segmentado Mujer / Hombre / No especificado (mujer, hombre, no_especificado).
- Alergias*: input con placeholder "Medicamento o sustancia y reacción" y a la derecha el botón secundario "Sin alergias conocidas" que escribe ese texto. Ayuda: "«Sin alergias conocidas» se escribe explícito: un campo vacío no significa que no tenga alergias."
- Teléfono (opcional, type="tel").
- Duplicados (DS 7.7): mientras se escribe, busca con useCoincidencias(apellido paterno) y useCoincidencias(fecha en AAAA-MM-DD). Hay coincidencia si el apellido paterno es igual (compara con normalizarTexto) y el primer nombre empieza igual, o si la fecha de nacimiento es la misma. Muestra arriba del formulario un Aviso warning "Posible paciente ya registrado" con cada coincidencia ("GARCÍA LÓPEZ, María Fernanda · Mujer · 34 años · 12/mar/1992 · Exp. 0004-8217") y un botón fantasma "Abrir expediente"; al final el botón secundario "No es ninguno: registrar nuevo", que oculta esas coincidencias. Mientras haya coincidencias sin descartar, "Registrar paciente" se ve deshabilitado (aria-disabled) y abajo dice "Revisa las coincidencias: abre el expediente o confirma que es alguien nuevo."
- Al enviar: valida los obligatorios, marca cada uno en rojo con "Escribe nombre(s).", "Escribe apellido paterno.", etc., y lleva el foco al primero. Guarda con useRegistrarPaciente(); con éxito, el aviso "Paciente registrado · Exp. 0004-8300" y abre /pacientes/:id. Con error, Aviso crítico "No se pudo registrar".
- Botones: "Cancelar" (secundario) y "Registrar paciente" (primario, icono UserPlus; "Registrando…" mientras envía).
```

Revisa: buscar `garcia` (sin acento) encuentra a María Fernanda; escribir "María" + "García" en el registro muestra la alerta de duplicado (RF-03, RF-04).

### Prompt 5 · Expediente

Adjunta: `p05-expediente.png` y `p05-expediente-sin-notas.png`.

```text
Pantalla /pacientes/:id (p05-expediente y p05-expediente-sin-notas). Las capturas son la referencia de diseño.

Componente CabeceraPaciente (DS 7.1), reutilizable en todas las pantallas clínicas, con las clases pb:
- Fondo --color-banner-bg, texto --color-banner-fg y radio de 12 px; sin radio con la prop flush (cuando va pegada arriba).
- Izquierda: círculo con iniciales(p), el nombre con nombreCabecera(p) y debajo "Mujer · 34 años · Exp. 0004-8217" (expediente en mono). La edad usa la fecha de referencia que reciba (la de la consulta) o la de hoy.
- Centro, solo si el contenedor mide 620 px o más (container query, ya está en ds.css): Nacimiento (formatearFecha), Expediente (mono) y Tipo de sangre ("—" si falta).
- Derecha: si las alergias no empiezan con "Sin alergias conocidas", cápsula roja clara pb-alert con icono ShieldAlert y "Alergia: Penicilina (urticaria generalizada)"; si no, cápsula neutra pb-neutral "Sin alergias conocidas".

Página:
- CabeceraPaciente con usePaciente(id). Si existeBorrador(id): Aviso info "Tienes una consulta sin autorizar · El borrador está guardado solo en este equipo y todavía no está en el expediente." con el botón secundario chico "Continuar consulta".
- Dos columnas: historial a la izquierda; a la derecha (360 px) deja espacio para "Pregúntale al expediente", que haremos después.
- Encabezado "Historial de notas" con el botón primario "Nueva consulta" (icono FilePlus2) hacia /pacientes/:id/consulta; si hay borrador dice "Continuar consulta" (icono Mic).
- Historial con useNotasPaciente(id) como línea de tiempo tl dentro de una tarjeta, de la más reciente a la más antigua. Cada renglón es un enlace a /notas/:id: arriba en pequeño "14/ago/2026 · 10:30 · Seguimiento", el diagnóstico principal en negritas ("— Sin diagnóstico" si falta), el médico en gris, la insignia b-success con icono ("Autorizada" o "Corregida · v2") y un ChevronRight.
- Vacío: Vacio con FileText, "Aún no hay notas autorizadas" y "Inicia una consulta: cuando autorices la nota aparecerá aquí."
- Título de pestaña: "GARCÍA LÓPEZ, María Fernanda · Expediente".
```

Revisa: María Fernanda tiene 3 notas y la primera dice "Corregida · v2"; Luis Alberto Torres no tiene notas (RF-06).

### Prompt 6 · Consulta: estructura y formulario

Adjunta: `p06-consulta-vacia.png`, `p06-formulario-lleno.png`, `p06-antecedentes.png`, `p06-signos-vitales.png` y `p06-diagnosticos-medicamentos.png`.

Es el prompt más grande (3 a 5 créditos). Si Lovable se queda corto, mándalo en dos partes: "Estructura e índice" (hasta el panel derecho) y "Tipos de campo". Dividirlo no ahorra créditos, pero reduce el riesgo de pagar un intento que falla completo.

```text
Pantalla /pacientes/:id/consulta (capturas p06-*, referencia de diseño). En este paso van la estructura y el formulario; el borrador local y la grabadora van en los siguientes prompts.

Estructura (componente MarcoTrabajo, reutilizable en la corrección):
- Fija debajo de la barra de 48 px: CabeceraPaciente (flush) y la barra de la consulta. Mide su altura con useAlto() y guarda 48 + altura en la variable CSS --alto-cabecera del contenedor, para que las columnas fijas, las alertas fijas y el scroll la respeten.
- Barra de la consulta (surface, borde inferior, controles de 32 px): "Fecha" (CampoFecha compacto, máximo hoy), "Hora (24 h)" (texto "HH:MM" validado con leerHora; error "Usa 24 h, por ejemplo 16:30.") y "Tipo de consulta" (Segmentado chico Primera vez / Seguimiento). A la derecha: la insignia b-draft con icono FilePen "Borrador · solo en este equipo · no está en el expediente", debajo el estado del guardado y el botón btn-critical-ghost chico "Descartar borrador" (icono Trash2). Los inputs llevan id "campo-identificacion.fecha_consulta", "campo-identificacion.hora_atencion" y "campo-identificacion.tipo_consulta".
- Debajo, tres columnas: índice de secciones (220 px), formulario (máximo 960 px, centrado) y panel derecho de 360 px con pestañas "Transcripción", "Historial" y "Referencias". Índice y panel quedan fijos (sticky en top: var(--alto-cabecera), alto calc(100vh - var(--alto-cabecera))) con su propio scroll. Por ahora: Historial con useNotasPaciente (cada nota es una tarjeta que abre /notas/:id en otra pestaña, con icono ExternalLink); Transcripción y Referencias con su estado vacío.

Formulario (EditorFormato), generado desde FORMATO_CLINICO_GENERAL de src/plantilla/formatoClinicoGeneral.ts:
- Cada sección es una tarjeta <section id="seccion-<id>" data-seccion="<id>"> con el título "02  Motivo y padecimiento actual" (número en mono gris, título t-title-md) y scroll-margin-top de var(--alto-cabecera) + 16 px. Los grupos con título (Signos vitales, Exploración física) llevan subtítulo con línea inferior. Signos vitales en dos columnas; el resto en una.
- Lee cada campo con obtenerValor(contenido, ref) recorriendo CAMPOS de src/lib/contenido.ts. El contenedor de cada campo lleva id idCampo(ruta), por ejemplo "campo-motivo_padecimiento.motivo_consulta".
- Encabezado de cada campo: etiqueta en negritas; "*" rojo si es obligatorio (con sr-only "obligatorio para autorizar"); insignia de origen: origen "ia" → b-info con icono Sparkles "IA"; "editado" → b-neutral con icono Pencil "Editado"; manual sin insignia; si el estado es "negado", insignia b-neutral con icono Ban "Negado". Debajo, la ayuda del campo en gris.
- Al editar, aplica la regla de origen: conOrigenEditado(anterior, nuevo) en campos simples y origenTrasEditar(anterior, false) en renglones. Lo de la IA pasa a "editado" y lo vacío a "manual".
Tipos de campo:
- texto y textoLargo: textarea (2 y 4 renglones) con placeholder "— Sin información" y fondo canvas si está vacío; contador "44 / 500" (4000 en textoLargo) alineado a la derecha. Si se escribe en un campo sin_informacion pasa a "referido"; si se borra todo queda valor null y "sin_informacion".
- antecedente: igual (límite 1000) y, a la derecha de la etiqueta, un Segmentado chico Referido / Negado / Sin información (p06-antecedentes). Negado escribe "Negados" ("Negadas" en alergias) si estaba vacío; Sin información borra el texto; Referido con texto vacío pone el foco en el textarea, cuyo placeholder cambia a "Escribe lo referido".
- vital: input de 144 px alineado a la derecha con inputmode="decimal", data-vital y la unidad dentro (input-wrap + unit). Acepta coma o punto con leerNumero; si se escribe algo que no es número no se guarda y al salir se restaura. A la derecha, Segmentado chico Medido / Referido, deshabilitado si está vacío; un número en un campo vacío queda "medido". Debajo, la línea de estado con evaluarVital(clave, valor, esMenor) de src/lib/vitales.ts: vacío → icono Minus "Sin información" (vstatus s-empty); ok → CheckCircle2 "Dentro de rango" (s-ok); advertencia → TriangleAlert y el mensaje (s-warn, contenedor is-warning); crítico → OctagonAlert (s-crit, is-critical); error → CircleAlert y el mensaje (s-err, is-error). Si la evaluación trae sugerencia, botón secundario chico "Usar 162" que la aplica. Enter pasa al siguiente signo vital con irAlSiguienteVital.
- presion: dos inputs enteros "148 / 92" con "mmHg" en el mismo input-wrap (aria-label Sistólica y Diastólica); al escribir "/" en la sistólica el foco salta a la diastólica. Medido / Referido igual. Evalúa con evaluarPresion.
- imc: solo lectura, caja calc punteada con calcularImc(peso, talla, esMenor): "23.4 kg/m²" y la clasificación a la derecha; si falta un dato, icono Calculator "Se calcula con peso y talla". No se guarda.
- diagnosticos: cada renglón es una tarjeta con "Diagnóstico principal" o "Diagnóstico N", insignia de origen y botón de icono Trash2 "Quitar diagnóstico N"; campo "Descripción" (placeholder "Diagnóstico o problema clínico") y Segmentado chico "Condición": Confirmado / Presuntivo / Por determinar. Con descripción y sin condición: aviso ámbar "Elige la condición: es obligatoria para autorizar." Botón secundario chico "Agregar diagnóstico" (renglón nuevo con origen "manual" y foco en su descripción). Lista vacía: caja punteada "— Sin información".
- medicamentos: igual, con "Medicamento" ancho (placeholder "Nombre genérico") y debajo 4 columnas Dosis, Vía, Frecuencia y Duración (placeholders "— (ej. 500 mg)", "— (ej. oral)", "— (ej. cada 8 h)", "— (ej. 3 días)"). Botón "Agregar medicamento".
- La sección 09 "Revisión y autorización" es un resumen; por ahora deja un texto provisional.
- Bajo el formulario: "Ctrl + Enter pasa a la sección siguiente · Enter en los signos vitales pasa al siguiente · / en la presión salta a la diastólica" con <kbd>. Ctrl+Enter (o ⌘+Enter) llama irASeccionSiguiente.

Índice de secciones (IndiceSecciones, DS 6.6): lista steps con las 8 secciones de la plantilla. Cada una con step-dot (el número, o un check con la clase done si tiene datos), el título, "llenos/total" en gris (estaVacio en CAMPOS_GUARDADOS de la sección), TriangleAlert ámbar si tiene alertas abiertas y un candado (Lock) en la 09 si falta algo para autorizar. Al hacer clic, irASeccion. La activa (aria-current="step") es la última sección cuyo inicio está en el tercio superior del área visible; recalcula al hacer scroll.

Contenido provisional para ver el formulario lleno como en p06-formulario-lleno: fusionarRespuesta(crearBorrador(id, true), procesarFaringitis, { modo: "consulta", consentimiento: true }).secciones, con procesarFaringitis importado de src/mocks/procesar_faringitis.json. Edad: esMenor = edadEnAnios(fecha_nacimiento, fecha_consulta) < 18.
```

Revisa: se ve como `p06-formulario-lleno`; las insignias "IA" son azules; "Negado" y "— Sin información" se ven distintos (CA-04); "1.62" en talla muestra el error con "Usar 162"; el IMC se calcula.

### Prompt 7 · Borrador en el navegador

Adjunta: `p07-dialogo-descartar.png`.

```text
Conecta la consulta al borrador local. Las reglas ya están programadas en los archivos base; solo conéctalas:
- Quita el contenido provisional del prompt anterior.
- useDocumentoLocal<Borrador> de src/hooks/useDocumentoLocal.ts con clave claveBorrador(pacienteId); listo cuando ya cargaron el paciente y sus notas; leer: () => leerBorrador(pacienteId); crear: () => crearBorrador(pacienteId, tieneNotas), que propone "Seguimiento" si el paciente ya tiene notas. Guarda 500 ms después de cada cambio y vuelve a cargar al abrir la pantalla.
- Cada cambio de campo: actualizar(d => ({ ...d, secciones: { ...d.secciones, [ref.grupo]: { ...d.secciones[ref.grupo], [ref.campo.clave]: valor } } })). Fecha, hora y tipo de consulta van en d.identificacion.
- Estado del guardado bajo la insignia del borrador (aria-live="polite", icono HardDrive): "Se guarda en este equipo al escribir" (sin cambios todavía), "Guardado en este equipo · 10:42" (hora de México con horaEnMexico) o, en rojo con CircleAlert, "No se pudo guardar en este equipo".
- useAvisoAlSalir(existeEnEquipo): el navegador avisa al cerrar o recargar la pestaña con un borrador.
- "Descartar borrador" abre el diálogo de p07-dialogo-descartar: título "¿Descartar el borrador?", cuerpo "Se borra todo lo capturado en esta consulta. No se puede deshacer.", botones "Seguir editando" (secundario) y "Descartar borrador" (btn-critical). Al confirmar: descartar() y el aviso "Borrador descartado. No se guardó nada en el expediente."
- Mientras carga: tarjeta con Esqueleto. Título de pestaña: "GARCÍA LÓPEZ, María Fernanda · Consulta".
```

Revisa: escribe en un campo, recarga la página y sigue ahí (CA-03); en las herramientas del navegador (*Application → Local Storage*) existe `vozclinica:borrador:1`; "Cerrar sesión" ahora pregunta antes.

### Prompt 8 · Grabadora y "Procesar audio"

Adjunta: `p08-consentimiento-pendiente.png`, `p08-grabando.png`, `p08-audio-listo.png`, `p08-procesando.png` y `p08-error-microfono.png`.

```text
Arriba del formulario, la tarjeta "Audio de la consulta" (componente Grabadora) con useGrabadora() de src/hooks/useGrabadora.ts. El hook ya hace MediaRecorder, el medidor de nivel, el corte a los 20:00 y la validación de archivos (50 MB y 20 min); el audio vive solo en memoria. Las capturas son la referencia de diseño.
- Encabezado "Audio de la consulta" con icono Mic y, a la derecha, la insignia del estado: Lista (b-neutral, Mic), Grabando (b-critical, Mic), Pausada (b-warning, Pause), Audio listo (b-action, FileAudio), Procesando (b-info, Loader2), Error (b-critical, CircleAlert).
- Segmentado "Modo de captura": Dictado / Consulta (deshabilitado mientras se graba o hay un audio). En Consulta aparece la casilla obligatoria "El paciente autorizó la grabación *". Ayuda en Dictado: "Dictado: solo hablas tú. Consulta: se graba la conversación con el paciente y necesitas su autorización."; en Consulta: "En modo Consulta hay que marcar el consentimiento del paciente antes de grabar o subir un audio. Se guarda con la nota."
- Lista: botones secundarios "Grabar" (Mic) y "Subir archivo" (Upload, con un input file oculto accept="audio/*,.mp3,.m4a,.wav,.webm"). En Consulta sin consentimiento los dos se deshabilitan y aparece en ámbar "Para grabar o subir un archivo, marca primero «El paciente autorizó la grabación»." (p08-consentimiento-pendiente). Si no: "Máximo 20 minutos por audio. Archivos mp3, m4a, wav o webm de hasta 50 MB." y, si el borrador ya tiene un audio procesado, " Ya procesaste un audio: el nuevo solo llena los campos vacíos y nunca cambia lo que ya tiene valor."
- Grabando o Pausada (p08-grabando): "00:02 / 20:00" grande en tnum, un medidor de 16 barras verticales (role="meter", aria-valuenow) que se llenan con el nivel, y a la derecha Pausar/Reanudar y Detener.
- Audio listo (p08-audio-listo): caja canvas con icono FileAudio, el nombre del archivo, "00:03 · 0.1 MB · solo en la memoria de este navegador" y un <audio controls>; abajo el botón fantasma "Volver a grabar" (o "Elegir otro audio" si fue un archivo) y a la derecha el botón primario "Procesar audio" (Sparkles).
- Procesar: procesarAudio(audio, info.nombre, pacienteId, modo, signal) de src/api/consultas.ts con un AbortController que corta a los 180 s (LIMITES.timeoutProcesarMs). Mientras espera (p08-procesando): caja info con spinner, "Transcribiendo el audio…" los primeros 15 s y luego "Llenando el formato…", el tiempo transcurrido y "puede tardar hasta un minuto por cada 5 min de audio", y un botón fantasma "Cancelar" que vuelve a Audio listo.
- Éxito: actualizar(d => fusionarRespuesta(d, respuesta, { modo, consentimiento: modo === "consulta" && consentimiento })) de src/lib/fusion.ts, descartarAudio() y el aviso "Listo: la IA llenó el formato. Revisa cada campo antes de autorizar."
- Error: Aviso crítico "No se pudo procesar el audio" con mensajeDeError(error) o, si se agotó el tiempo, "El procesamiento tardó más de 3 minutos. Tu audio sigue aquí: reintenta o usa un audio más corto."; el botón primario dice "Reintentar" y el audio sigue en memoria.
- Errores del micrófono (errorMicrofono), en un Aviso crítico (p08-error-microfono):
  permiso → "El navegador no tiene permiso para usar el micrófono" · "Haz clic en el icono del candado junto a la dirección de la página, en «Micrófono» elige «Permitir» y vuelve a pulsar Grabar. También puedes subir un archivo de audio."
  sin_microfono → "No encontramos un micrófono" · "Conecta un micrófono o unos audífonos con micrófono y vuelve a intentar, o sube un archivo de audio."
  no_soportado → "Este navegador no permite grabar" · "Usa Chrome o Edge recientes en una página con HTTPS, o sube un archivo de audio."
  otro → "No se pudo usar el micrófono" · "Puede estar ocupado por otra aplicación (por ejemplo, una videollamada). Ciérrala y vuelve a intentar, o sube un archivo."
  errorArchivo → Aviso crítico "No se pudo usar ese archivo" con el mensaje.
- Si el médico sale de la pantalla mientras se procesa, cancela la petición.
```

Revisa: en modo Consulta no se puede grabar sin el consentimiento (CA-10); graba unos segundos, detén, procesa y el formulario se llena con insignias "IA" (CA-01, hito 1). Para probar sin micrófono, sube cualquier `.mp3` o `.wav`: en modo de datos de ejemplo la respuesta siempre es la consulta de faringitis.

### Prompt 9 · Evidencia y transcripción

Adjunta: `p09-evidencia.png` y `p09-transcripcion-resaltada.png`.

```text
Evidencia por campo y panel de transcripción (VC-19). Las capturas son la referencia de diseño.
- Crea el contexto ProveedorEvidencia para la consulta (y después la corrección) con: citasActivas, enfocar(citas | null), ver(citas), que pide cambiar a la pestaña Transcripción, y un contador de solicitudes.
- Componente ZonaEvidencia que envuelve cada campo (MarcoCampo) y cada renglón de lista. Si tiene evidencia y su origen es "ia" o "editado": al pasar el cursor o al enfocar el campo aparece un popover (surface-raised, sombra 2, máximo 440 px, alineado a la derecha) con el título en mayúsculas pequeñas "LO QUE SE DIJO EN EL AUDIO" (icono Quote), cada cita en cursiva entre «» con borde izquierdo y el botón fantasma chico "Ver en la transcripción".
  - Se abre arriba del campo, o abajo si arriba no hay 180 px libres por la cabecera fija (lee --alto-cabecera). Al mover el cursor hacia el popover no se cierra (retraso de 180 ms). z-index 25, por debajo de la cabecera fija (30).
  - El botón queda dentro de la zona, así se llega con Tab después del campo.
  - Al enfocar el campo: enfocar(citas); al salir de la zona: enfocar(null).
- Pestaña Transcripción (PanelTranscripcion): segmentos de borrador.transcripcion. Si hay roles distintos de médico, cada segmento muestra "Médico" (color acción), "Paciente" (color info), "Acompañante" o "Sin identificar"; luego el minuto "00:04" en mono gris; y el texto. Si hay varios audios, un separador "AUDIO 2". Las citas activas se resaltan con <mark className="evidencia"> usando rangosDeCitas(texto, citas) de src/lib/evidencia.ts, y el panel (no la página) se desplaza hasta la primera cita. Vacío: icono MessageSquareText, "Aún no hay transcripción" y "Graba o sube un audio y pulsa «Procesar audio». Aquí verás lo que se dijo, separado por hablante."
- Pestañas accesibles (role="tablist", role="tab", aria-selected, flechas izquierda y derecha) y, al pedir ver una cita, el panel cambia solo a Transcripción.
```

Revisa: al pasar el cursor por la temperatura sale la cita y "Ver en la transcripción" la resalta en el panel (RF-27).

### Prompt 10 · Alertas

Adjunta: `p10-paciente-no-coincide.png`, `p10-valor-imposible.png` y `p10-alergia-medicamento.png`.

```text
Alertas de la consulta (§10 de la guía). Las capturas son la referencia de diseño. Calcúlalas con calcularAlertas({ contenido: borrador.secciones, alertasIa: borrador.alertas, resueltas: borrador.alertas_resueltas, alergiasPaciente: paciente.alergias, esMenor }) de src/lib/alertas.ts; se recalculan con cada cambio.
- paciente_no_coincide: Aviso crítico fijo (sticky, top: var(--alto-cabecera) + 8 px) arriba de la grabadora, con id "campo-alerta-paciente", título con icono UserX "El paciente del audio no coincide", el mensaje + " No podrás autorizar hasta que lo confirmes." y los botones "Es el paciente correcto" (agrega el id a alertas_resueltas) y "Cambiar paciente" (btn-critical-ghost). "Cambiar paciente" abre el diálogo "¿Cambiar de paciente?": "Se descarta este borrador de <nombre> para que nada quede en el expediente equivocado. Elige al paciente correcto y vuelve a procesar el audio." con "Seguir en esta consulta" y "Descartar y elegir otro paciente" (btn-critical: descarta y va a /pacientes).
- valor_imposible y fuera_de_rango ya se ven en la línea de estado de cada signo vital.
- sin_evidencia y unidad_convertida: mensaje informativo azul (msg msg-info, icono Info) bajo el campo con textoAviso(alerta), por ejemplo "La IA propuso un valor sin respaldo en el audio y se descartó." En las listas, bajo la lista. Usa alertasDeCampo(alertas, ruta).
- alergia_medicamento (campo "plan.medicamentos[i]"): el renglón del medicamento con borde rojo y dentro un Aviso crítico "Alergia registrada" con el mensaje y dos salidas: "Quitar medicamento" (secundario) e "Indicar con justificación…" (btn-critical-ghost). Esta muestra un textarea "¿Por qué lo indicas de todos modos?" (mínimo 5 letras) con "Cancelar" e "Indicar de todos modos" (btn-critical); al confirmar agrega "<id>::<justificación>" a alertas_resueltas y el renglón muestra la insignia b-neutral "Alergia revisada" (ShieldCheck).
- Otras alertas de la IA sin campo: un Aviso según la severidad; si bloquea, botón "Marcar como revisada".
- El índice marca con TriangleAlert las secciones con alertas abiertas.
```

Revisa: procesa el audio en la consulta de Jorge Ramírez y aparece "El paciente del audio no coincide" (CA-11); en Rosa Elena Castillo (alérgica a sulfas) agrega "Trimetoprima con sulfametoxazol" y aparece la alerta de alergia.

### Prompt 11 · Revisión y autorización

Adjunta: `p11-revision-faltantes.png`, `p11-revision-completa.png` y `p11-dialogo-autorizar.png`.

```text
Sección 09 "Revisión y autorización" (componente SeccionRevision, reutilizable en la corrección). Las capturas son la referencia de diseño.
- Cinco cifras grandes (t-display) en tarjetas canvas: "De la IA sin cambios" (nota "Revísalos antes de autorizar"), "Editados", "Capturados a mano", "Vacíos" (nota "Quedan como «Sin información»") y "Alertas abiertas", con resumirContenido(secciones) y alertasAbiertas(alertas).length.
- Pendientes = calcularFaltantes({ contenido, identificacion, modoCaptura: modo_captura, consentimiento: consentimiento_grabacion }) más las alertas de alertasQueBloquean(alertas), con estas etiquetas: paciente_no_coincide "Confirma que es el paciente correcto" (ruta "alerta-paciente"), valor_imposible "Corrige <campo en minúsculas>", alergia_medicamento "Revisa la alergia del medicamento".
- Con pendientes: Aviso warning "Para autorizar falta:" con cada pendiente como botón-enlace que llama irACampo(ruta). Sin pendientes: Aviso success "Todo lo obligatorio está completo" · "Revisa los campos que llenó la IA: al autorizar confirmas que los revisaste."
- Botón primario "Autorizar nota" (ShieldCheck). Con pendientes se ve deshabilitado (aria-disabled, no disabled) y al pulsarlo lleva al primero; debajo, en ámbar y negritas: "Falta: Diagnóstico · Padecimiento actual" y ". Pulsa el botón para ir al primero." Sin pendientes, debajo: "Al autorizar, la nota entra al expediente y se borra el borrador de este equipo."
- Diálogo (p11-dialogo-autorizar), role="alertdialog": título "¿Autorizar la nota?"; cuerpo "La nota se guardará en el expediente de <b>GARCÍA LÓPEZ, María Fernanda</b> (Exp. <mono>0004-8217</mono>). Podrás corregirla después; cada corrección queda registrada como una versión nueva. La IA llenó <b>13 campos</b> que no cambiaste: al autorizar confirmas que los revisaste." La última frase solo si n > 0 (en singular: "1 campo … lo revisaste"). Botones "Seguir editando" y "Autorizar nota" ("Autorizando…").
- Al confirmar: useAutorizarNota().mutateAsync({ paciente_id, plantilla: PLANTILLA, fecha_consulta, hora_atencion, tipo_consulta, modo_captura: borrador.modo_captura ?? "dictado", consentimiento_grabacion, contenido: prepararContenido(borrador.secciones), transcripcion: borrador.transcripcion }).
- 201: cerrar() del borrador (lo borra y ya no vuelve a guardar), el aviso "Nota autorizada · 28/oct/2026 · 10:52" (formatearFechaHora de autorizada_en de la versión 1) y navega con replace a /notas/:id.
- 400: Aviso crítico "La API no aceptó la nota" con el mensaje y los faltantes de la respuesta traducidos a etiquetas (campoPorRuta), y lleva al primero con irACampo. Otros errores: el mensaje.
```

Revisa: sin diagnóstico el botón dice qué falta y lleva al campo (CA-06); al autorizar, la nota aparece en el historial y el borrador desaparece de localStorage (CA-07).

### Prompt 12 · Nota autorizada y versiones

Adjunta: `p12-nota-autorizada.png` y `p12-version-anterior.png`.

```text
Pantalla /notas/:id con useNota(id) (RF-07, RF-36). Las capturas son la referencia de diseño.
- CabeceraPaciente fija (edad a la fecha de la consulta), con --alto-cabecera como en la consulta.
- Arriba: enlace "Expediente de GARCÍA LÓPEZ, María Fernanda"; título "Nota del 14/ago/2026" con la insignia de estado y, si existeCorreccion(id), la insignia b-draft "Corrección sin autorizar". A la derecha "Imprimir" (secundario, Printer; abre /notas/:id/imprimir, con ?version=N si se ve una anterior) y "Corregir" (primario, FilePen; "Continuar corrección" si ya hay una).
- Tarjeta de datos en 3 columnas: "Fecha y hora de atención", "Tipo de consulta", "Modo de captura" ("Consulta · con consentimiento"), "Médico responsable" con "· Céd. …", "Versión vigente" ("v2 de 2"; "Versión mostrada" si es otra) y "Autorizada" (fecha y hora · médico). Si la versión tiene motivo: "Motivo del cambio".
- Componente NotaLectura (reutilizable en la impresión con la prop impresion): una tarjeta por sección 02 a 08 con una lista de definición.
  Texto: el valor con saltos de línea, o "— Sin información" en gris; insignias IA / Editado y "Negado".
  Signos vitales en 2 columnas: "148/92 mmHg" en negritas, "Medido" en gris y, según evaluarVital/evaluarPresion, "Fuera de rango" (TriangleAlert ámbar), "Crítico" o "Valor no válido". IMC: "23.4 kg/m² · Normal · calculado".
  Diagnósticos numerados: "1. Faringitis, probablemente viral · Presuntivo" con su insignia de origen ("(principal)" si hay más de uno).
  Medicamentos en una tabla Medicamento / Dosis / Vía / Frecuencia / Duración con "—" en lo vacío.
- Panel derecho de 360 px fijo con pestañas "Versiones" (con el total) y "Transcripción".
  Versiones (PanelVersiones): tarjetas-botón con History, "Versión 2" + "Vigente" (b-success) o "Anterior" (b-neutral), fecha y hora, autor y "Motivo: …" o "Autorización original"; la elegida con borde y fondo de acción (aria-pressed).
  Al elegir una anterior, la página sube y aparece el Aviso warning "Versión anterior · no vigente" · "Esta versión se conserva sin cambios para consulta. La que vale es la versión 2." con el botón "Ver la versión vigente (v2)".
  Transcripción: PanelTranscripcion con la transcripción de la versión elegida.
```

Revisa: la nota del 14/ago/2026 de María Fernanda tiene 2 versiones y la 1 se puede ver sin cambios.

### Prompt 13 · Corrección con versiones

Adjunta: `p13-correccion.png` y `p13-dialogo-motivo.png`.

```text
Pantalla /notas/:id/corregir (RF-34, RF-35): la misma estructura que la consulta (MarcoTrabajo, IndiceSecciones, EditorFormato, PanelDerecho y SeccionRevision), sin grabadora. Las capturas son la referencia de diseño.
- Copia de trabajo con useDocumentoLocal<Correccion>: clave claveCorreccion(notaId), leer: () => leerCorreccion(notaId), crear: () => crearCorreccion(notaId, nota.version_vigente, contenido de la versión vigente). useAvisoAlSalir(existeEnEquipo). Envuelve todo en ProveedorEvidencia.
- Barra: a la izquierda "Corrigiendo la nota" en pequeño y abajo el enlace "14/ago/2026 · 10:30", la insignia de estado y "Parte de la versión 2"; a la derecha la insignia b-draft "Corrección sin autorizar", el estado del guardado y "Descartar corrección". Ese diálogo: "¿Descartar la corrección?" · "Se borran los cambios de esta corrección. La nota autorizada se queda como estaba." · "Seguir editando" / "Descartar corrección" (al confirmar: cerrar(), aviso "Corrección descartada. La nota se queda como estaba." y vuelve a /notas/:id).
- Aviso info arriba del formulario: "La versión vigente no cambia hasta que autorices la corrección" · "Cada corrección autorizada queda registrada como una versión nueva, con tu nombre, la fecha y el motivo. La identificación y los datos de la atención no se corrigen aquí."
- Mismas reglas de origen y las mismas alertas locales (calcularAlertas con alertasIa: []). Panel: transcripción de la versión vigente, historial sin esta nota (excluirNota) y referencias.
- Sección 09: pendientes = calcularFaltantes({ contenido }) + bloqueos; y si prepararContenido(secciones) es igual a prepararContenido(contenido vigente), el primer pendiente es "Haz al menos un cambio en la nota". Botón "Autorizar corrección"; debajo "Se creará la versión 3. La versión 2 se conserva sin cambios."
- Diálogo (p13-dialogo-motivo): "¿Autorizar la corrección?" · "Se creará la versión 3 de la nota de <b>nombre</b>. La versión 2 se conserva sin cambios y se puede consultar." con el campo obligatorio "Motivo del cambio *" (textarea de 3 renglones, 500 caracteres, placeholder "Por ejemplo: Se corrige la dosis de paracetamol"). Si está vacío al confirmar: borde rojo y "Escribe el motivo: queda registrado con la versión nueva."
- Al confirmar: useAutorizarCorreccion(notaId).mutateAsync({ contenido: prepararContenido(secciones), motivo_cambio, version_base }).
  201: cerrar(), aviso "Corrección autorizada · versión 3" y vuelve a /notas/:id.
  409, o si version_base ya no es la vigente al abrir la pantalla: Aviso crítico "La nota cambió mientras la corregías" · "Recarga para ver la versión vigente (v3). Tu corrección partió de la versión 2 y no se puede autorizar sobre ella." con el botón "Descartar mi corrección y ver la vigente".
```

Revisa: corrige una dosis, escribe el motivo y se crea la versión 2; la 1 sigue igual (CA-09).

### Prompt 14 · Vista de impresión

Adjunta: `p14-impresion.png`.

```text
Pantalla /notas/:id/imprimir, sin layout ni navegación, con un diseño parecido a la plantilla en papel (VC-23). La captura es la referencia de diseño.
- Barra con "Volver a la nota" (secundario, ArrowLeft) e "Imprimir o guardar como PDF" (primario, Printer), oculta al imprimir (print:hidden). Al cargar la nota llama window.print() a los 400 ms.
- Encabezado: "VOZCLÍNICA · NOTA DE CONSULTA" pequeño, título "Formato Clínico General" y a la derecha "Versión de plantilla 1.1" y "Nota 12 · v2", con una línea gruesa abajo.
- Si la URL trae ?version=N y no es la vigente: franja punteada ámbar "Versión anterior · no vigente (la vigente es la versión 2)".
- 01 Identificación de paciente y atención, en dos columnas de etiqueta y valor: Paciente (nombreNatural), Expediente (mono), Fecha de nacimiento, Edad / sexo, Fecha y hora de atención, Tipo de consulta, Médico responsable, Cédula profesional (mono), Alergias registradas y Modo de captura (" · el paciente autorizó la grabación" si aplica).
- Secciones 02 a 08 con NotaLectura en modo impresión: título en mayúsculas con línea inferior, etiqueta y valor en dos columnas, sin insignias de origen; cada sección evita cortarse entre páginas (break-inside: avoid).
- 09 Revisión y autorización: Estado, Versión impresa ("v2 (vigente)"), Autorizada el, Autorizada por y Motivo del cambio; abajo una línea de firma con el nombre del médico y "Nombre del médico (equivale a la firma) · Céd. 12345678".
- Pie: "Datos ficticios · Documento generado por VozClínica el <fecha y hora>. La autorización electrónica de esta nota no sustituye una firma electrónica avanzada."
- Carta con márgenes de 14 mm y fondo blanco al imprimir (ya está en ds.css).
```

Revisa: "Imprimir" abre el diálogo de impresión del navegador y "Guardar como PDF" produce la nota completa (RF-42).

### Prompt 15 · Pregúntale al expediente (backboard.io)

Adjunta: `p15-preguntar-expediente.png`.

```text
En la columna derecha de /pacientes/:id, la tarjeta "Pregúntale al expediente" (RF-38). Backboard arma la respuesta en el backend solo con las notas autorizadas; el frontend usa usePreguntarExpediente(pacienteId) (POST /api/pacientes/{id}/preguntar). La captura es la referencia de diseño.
- Título t-title-sm con icono MessagesSquare y la ayuda "Responde solo con las notas autorizadas de <nombre natural> y te dice de qué nota sale cada dato."
- Si el paciente no tiene notas (total_notas 0): caja punteada "Aún no hay notas autorizadas que consultar."
- Textarea de 2 renglones (300 caracteres, placeholder "Por ejemplo: ¿qué alergias tiene?"; Enter envía y Shift+Enter cambia de línea) y el botón secundario "Preguntar" (Send; con spinner y "Buscando en las notas…" mientras espera). Es secundario porque el primario de la pantalla es "Nueva consulta".
- Tres preguntas sugeridas como insignias b-neutral clicables: "¿Qué alergias tiene?", "¿Qué diagnósticos ha tenido?" y "¿Qué medicamentos se le han indicado?".
- Respuesta (aria-live="polite") en una caja canvas: el texto y, si hay, "Fuentes" con un enlace por nota: "Nota del 14/ago/2026 · v2" hacia /notas/:id. Error: Aviso crítico "No se pudo consultar el expediente".
- Pie en gris: "Información de apoyo: verifica en la nota antes de decidir."
```

Revisa: "¿Qué alergias tiene?" responde con la penicilina y enlaza la nota de origen (paso 9 del guion de la demo).

### Prompt 16 · Referencias de apoyo (Tavily)

Adjunta: `p16-referencias.png`.

```text
Pestaña "Referencias" del panel derecho de la consulta y de la corrección (RF-39). Tavily busca en el backend solo en fuentes confiables; el frontend usa useReferencias(termino) (GET /api/referencias?termino=) y solo envía el término clínico, nunca datos del paciente. La captura es la referencia de diseño.
- En cada renglón de diagnóstico y de medicamento con 3 letras o más, un botón fantasma chico "Referencias" (BookOpen) antes del botón de quitar. Al pulsarlo, el panel cambia a la pestaña Referencias con ese término: agrega verReferencias(termino) y un contador al contexto ProveedorEvidencia.
- Contenido de la pestaña: buscador (role="search") con el término editable y un botón de icono Search; la ayuda "Solo se envía el término, nunca datos del paciente. Fuentes: MedlinePlus, OMS, OPS, gob.mx, IMSS y CENETEC."; los resultados como tarjetas con el título enlazado (abre en otra pestaña, ExternalLink), el dominio en gris y el fragmento.
- Estados: vacío (BookOpen, "Información de apoyo", "Pulsa «Referencias» en un diagnóstico o medicamento, o escribe un término de al menos 3 letras."), cargando (Esqueleto), error (Aviso crítico "No se pudieron cargar las referencias") y sin resultados ("No encontramos referencias de fuentes confiables para «…»").
- Pie en gris: "Información de apoyo: no sustituye el criterio médico." Las referencias nunca llenan campos.
- Para que quepan las tres pestañas en 360 px, quita los contadores y usa 10 px de relleno lateral.
```

Revisa: "Referencias" en el diagnóstico de faringitis abre la pestaña con resultados (en modo de ejemplo son búsquedas de MedlinePlus y gob.mx).

### Prompt 17 · Reportar error de la IA (Linear)

Adjunta: `p17-reportar-error-ia.png` y `p09-evidencia.png`.

```text
"Reportar error de la IA" (RF-44). n8n crea un issue en Linear desde el backend; el frontend usa useReportarErrorIa() (POST /api/ia/reportar-error) con { campo, motivo } y nada más. Las capturas son la referencia de diseño.
- En el popover de evidencia de cada campo o renglón llenado por la IA, junto a "Ver en la transcripción", un botón fantasma chico en gris "Reportar error de la IA" (Flag). Pasa la ruta: "signos_vitales.temperatura" o, en listas, "plan.medicamentos[0]".
- Agrega reportar(campo) al contexto ProveedorEvidencia y un único diálogo DialogoReportarError a nivel de pantalla, fuera del popover, para que no se cierre al mover el cursor.
- Diálogo (role="dialog"): título "¿Qué hizo mal la IA?"; texto "Campo: <b>Diagnósticos o problemas clínicos · renglón 1</b>. El reporte crea una tarea para el equipo con solo el nombre del campo y el motivo; no se envía texto clínico ni datos del paciente. Corrige el valor en el formulario como siempre." (etiqueta con campoPorRuta); "Motivo" con tres radios grandes con descripción: "El valor es incorrecto · Se dijo algo distinto a lo que llenó la IA." (valor_incorrecto), "La IA lo inventó · Eso no se dijo en el audio." (inventado) y "Le faltó algo que se dijo · La IA dejó fuera información del audio." (omitido). Botones "Cancelar" y "Enviar reporte" ("Enviando…").
- Éxito: cierra y muestra el aviso "Reporte enviado al equipo. No se envió ningún dato del paciente." Error: Aviso crítico dentro del diálogo "No se pudo enviar el reporte".
```

Revisa: desde el popover del diagnóstico, reporta "La IA lo inventó" y aparece el aviso de envío.

### 4.1 Bloque de colores para el prompt 2

Pégalo donde dice `[PEGA AQUÍ…]` en el prompt 2 (solo con Tailwind v3):

```ts
// const v = (n: string) => `var(--${n})`;
colors: {
  background: v("background"),
  foreground: v("foreground"),
  card: { DEFAULT: v("card"), foreground: v("card-foreground") },
  popover: { DEFAULT: v("popover"), foreground: v("popover-foreground") },
  primary: { DEFAULT: v("primary"), foreground: v("primary-foreground") },
  secondary: { DEFAULT: v("secondary"), foreground: v("secondary-foreground") },
  muted: { DEFAULT: v("muted"), foreground: v("muted-foreground") },
  accent: { DEFAULT: v("accent"), foreground: v("accent-foreground") },
  destructive: { DEFAULT: v("destructive"), foreground: v("destructive-foreground") },
  border: v("border"),
  input: v("input"),
  ring: v("ring"),
  // Tokens del DS con su nombre original
  bg: v("color-bg"),
  surface: { DEFAULT: v("color-surface"), hover: v("color-surface-hover"), raised: v("color-surface-raised") },
  canvas: v("color-canvas"),
  texto: { DEFAULT: v("color-text"), muted: v("color-text-muted"), subtle: v("color-text-subtle") },
  accion: {
    DEFAULT: v("color-action"),
    hover: v("color-action-hover"),
    fg: v("color-action-fg"),
    texto: v("color-action-text"),
    subtle: v("color-action-subtle"),
    "subtle-border": v("color-action-subtle-border"),
  },
  critico: { bg: v("color-critical-bg"), border: v("color-critical-border"), fg: v("color-critical-fg"), solid: v("color-critical-solid") },
  advertencia: { bg: v("color-warning-bg"), border: v("color-warning-border"), fg: v("color-warning-fg"), solid: v("color-warning-solid") },
  exito: { bg: v("color-success-bg"), border: v("color-success-border"), fg: v("color-success-fg"), solid: v("color-success-solid") },
  info: { bg: v("color-info-bg"), border: v("color-info-border"), fg: v("color-info-fg"), solid: v("color-info-solid") },
  banner: { bg: v("color-banner-bg"), fg: v("color-banner-fg"), muted: v("color-banner-muted") },
  resaltado: v("color-highlight"),
},
borderRadius: { sm: "4px", md: "8px", lg: "12px", xl: "16px" },
boxShadow: { 1: v("shadow-1"), 2: v("shadow-2"), 3: v("shadow-3") },
height: { control: v("control-h"), "control-sm": v("control-h-sm") },
minHeight: { control: v("control-h"), "control-sm": v("control-h-sm") },
```

## 5. Mapa de integraciones del evento

| Herramienta | Dónde aparece en la app | Quién la configura | Prompt o guía |
|---|---|---|---|
| **Lovable** | Toda la interfaz | German | Este documento |
| **ElevenLabs** (Scribe v2) | "Procesar audio" envía el audio a Django, que transcribe con Scribe | Luis (n8n) y Jeroben (credencial) | Prompt 8 · [guía de Luis §7](../luis-ia.md) |
| **n8n** | WF-1 procesa el audio; WF-2 y WF-5 alimentan y consultan la memoria; WF-3 Tavily; WF-4 Linear | Luis y Jeroben | [Guía de Luis §10 y §13](../luis-ia.md) |
| **backboard.io** | Extracción del formato (dentro de "Procesar audio") y "Pregúntale al expediente" | Luis | Prompts 8 y 15 · [guía de Luis §8 y §13](../luis-ia.md) |
| **Tavily** | Pestaña "Referencias" | Luis (WF-3) y Jeroben (endpoint) | Prompt 16 |
| **Linear** | Backlog del equipo (§7) y "Reportar error de la IA" | German (backlog) y Luis (WF-4) | Prompt 17 y §7 |

El frontend nunca llama directo a estos servicios ni guarda sus claves: todo pasa por la API de Django (RNF-04). En la demo conviene decirlo en voz alta.

## 6. Si todo el código tiene que salir de Lovable

En lugar del paso 3 de la §3, pide cada cimiento con un prompt así, en este orden: `config.ts`, `plantilla/*`, `lib/formatos.ts`, `lib/contenido.ts`, `lib/vitales.ts`, `lib/evidencia.ts`, `lib/fusion.ts`, `lib/alertas.ts`, `lib/borrador.ts`, `lib/navegacion.ts`, `api/tipos.ts`, `api/cliente.ts`, `mocks/*.json`, `api/mocks.ts`, `api/consultas.ts`, `hooks/*` y `styles/*`.

```text
Crea el archivo src/lib/formatos.ts con exactamente este contenido, sin cambiar nada:
[pega aquí el archivo de frontend/src/lib/formatos.ts]
```

Gasta más créditos y Lovable a veces "mejora" el código. Revisa cada archivo contra el original con la vista de código o en GitHub.

## 7. Linear: backlog en minutos con CSV

[`linear-backlog.csv`](linear-backlog.csv) tiene los 27 issues de REQUERIMIENTOS §13.2, en orden, con etiquetas (`frontend`, `backend`, `ia`, `demo`), prioridad (M → High, S → Medium, C → Low) y una descripción que apunta a la guía de cada quien.

1. En Linear crea el equipo **VozClínica** con el identificador **VC** y déjalo vacío, para que los issues se numeren de VC-1 a VC-27.
2. Crea una clave personal de API: *Settings → Account → Security & access → Personal API keys*.
3. (Opcional) Para asignar al importar, cambia la columna `Assignee` por el correo con el que cada quien entró a Linear. Si no, asígnalos después; el CSV trae el nombre en la descripción.
4. Ejecuta el importador oficial de Linear y responde las preguntas:

```bash
npx @linear/import
```

   Elige **"Linear (CSV export)"**, pega la clave de API, selecciona `docs/equipo/lovable/linear-backlog.csv`, contesta que **no** quieres crear un equipo nuevo, elige **VozClínica** y, en la asignación, "[Provided assignee]" si hiciste el paso 3 (si no, sin asignar).
5. Revisa que los números coincidan (VC-1 = esquema JSON… VC-27 = guion de la demo). Crea el ciclo de 2 días con todo lo de prioridad alta y conecta GitHub en Linear (*Settings → Integrations → GitHub*): si una rama o un PR menciona `VC-7`, el issue se mueve solo.

## 8. Plan B si se acaba el tiempo

El repo de Lovable acepta cualquier código que llegue a `main`. Si a 3 h de la entrega falta alguna pantalla, se puede copiar el componente o la página equivalente de `frontend/src/` al repo de Lovable y seguir desde ahí con prompts. Revisa antes qué permiten las reglas del evento.

## Fuentes

- Lovable, GitHub y sincronización en dos sentidos con la rama principal: [lovable.dev/faq/github](https://lovable.dev/faq/github)
- Lovable, imágenes en el chat (hasta 10 archivos por mensaje): [docs.lovable.dev/tips-tricks/using-images](https://docs.lovable.dev/tips-tricks/using-images) y [lovable.dev/faq/design/media/add-images-to-prompt](https://lovable.dev/faq/design/media/add-images-to-prompt)
- Lovable, conocimiento del proyecto: [lovable.dev/faq/development/knowledge](https://lovable.dev/faq/development/knowledge)
- Lovable, créditos y modos (Build, Plan y Chat): [docs.lovable.dev/introduction/credits-and-usage](https://docs.lovable.dev/introduction/credits-and-usage), [docs.lovable.dev/introduction/faq](https://docs.lovable.dev/introduction/faq) y [lovable.dev/pricing](https://lovable.dev/pricing)
- Lovable, modo Dev para editar el código: [docs.lovable.dev/features/dev-mode](https://docs.lovable.dev/features/dev-mode)
- Linear, importador CSV: [npmjs.com/package/@linear/import](https://www.npmjs.com/package/@linear/import) y [linear.app/docs/cli-importer](https://linear.app/docs/cli-importer)
