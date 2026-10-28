# VozClínica · frontend

Implementación de la [guía de German](../docs/equipo/german-frontend.md): todo lo que ve el médico, desde el inicio de sesión hasta autorizar y corregir una nota, con el borrador guardado **solo en el navegador** (D-02).

Es el mismo stack que pide la guía para Lovable: React 18, TypeScript, Vite, Tailwind, lucide-react, react-router y TanStack Query. **No usa Supabase ni Lovable Cloud**: todo va contra la API de Django.

## Arrancar

```bash
cd frontend
npm install
npm run dev        # http://localhost:8080
```

Sin `VITE_API_URL` la app usa los datos de ejemplo de `src/mocks/` (usuario `pmendez` o `esalas`, contraseña `demo1234`). El backend de ejemplo guarda pacientes y notas autorizadas en `localStorage`; para empezar de cero abre `/?reiniciar-mocks` antes de iniciar sesión.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas de la lógica (formatos, fusión, origen, obligatorios, signos vitales, evidencia, alertas) |
| `npm run typecheck` | Revisión de tipos |
| `npm run build` | Compila a `dist/` |

## Conectar con la API de Django

Copia `.env.example` a `.env` (o define las variables en el hosting):

```bash
VITE_API_URL=https://<dominio-de-la-api>   # sin diagonal final
VITE_USAR_MOCKS=false
```

Para pasar a la API **pantalla por pantalla** (§12 de la guía), `VITE_USAR_MOCKS` acepta la lista de recursos que siguen con datos de ejemplo. Por ejemplo, con la API ya lista para todo menos la IA y las notas:

```bash
VITE_USAR_MOCKS=ia,notas
```

Recursos: `auth`, `pacientes`, `notas`, `ia`, `plantillas`.

## Dónde está cada cosa

| Guía | Archivo |
|---|---|
| Prompt 1 · config y cliente | `src/config.ts`, `src/api/cliente.ts`, `src/api/mocks.ts` |
| Prompt 2 · design system | `src/styles/tokens.css` (copiado del DS v0.4, líneas 14 a 130), `src/index.css`, `tailwind.config.ts` |
| Prompt 3 · login y layout | `src/pages/Login.tsx`, `src/components/layout/` |
| Prompt 4 · pacientes y expediente | `src/pages/Pacientes.tsx`, `src/pages/Expediente.tsx`, `src/components/paciente/` |
| Prompt 5 · consulta y formulario | `src/pages/Consulta.tsx`, `src/components/consulta/` |
| Prompt 6 · borrador local | `src/lib/borrador.ts`, `src/hooks/useDocumentoLocal.ts` |
| Prompt 7 · grabadora | `src/hooks/useGrabadora.ts`, `src/components/consulta/Grabadora.tsx` |
| Prompt 8 · autorizar | `src/components/consulta/SeccionRevision.tsx`, `src/lib/contenido.ts` (`calcularFaltantes`) |
| Prompt 9 · nota, versiones y corregir | `src/pages/NotaVer.tsx`, `src/pages/NotaCorregir.tsx`, `src/pages/NotaImprimir.tsx` |
| §8 · configuración del formulario | `src/plantilla/formatoClinicoGeneral.ts` (copiado tal cual), `src/plantilla/valores.ts` |
| §9 · fusión con la IA | `src/lib/fusion.ts` |
| §10 · alertas | `src/lib/alertas.ts`, `src/lib/vitales.ts` |
| §11 · formatos | `src/lib/formatos.ts` |
| §12 · datos de ejemplo | `src/mocks/` |

`formatoClinicoGeneral.ts` y las claves de los campos son un contrato con Luis y Jeroben: no las cambies sin avisarles.

## Reglas que respeta

- Nada clínico sale del navegador hasta autorizar. El borrador vive en `vozclinica:borrador:<pacienteId>` y la corrección en `vozclinica:correccion:<notaId>`; el audio vive solo en memoria y se descarta después de procesarlo.
- La identificación es de solo lectura: viene de la API.
- Un campo vacío se ve como "— Sin información"; "Negado" es un estado distinto.
- Corregir no sobrescribe: cada corrección autorizada crea una versión nueva.
- Los signos vitales y la alergia contra medicamento se validan en el navegador con las mismas reglas que los filtros de Luis; la regla que vale para autorizar es la del backend.

## Desplegar

El frontend es un sitio estático. En Vercel o Netlify, crea el proyecto desde este repositorio con **Root Directory = `frontend`**, comando `npm run build` y salida `dist`. `vercel.json` y `public/_redirects` ya mandan todas las rutas a `index.html`. Define `VITE_API_URL` y `VITE_USAR_MOCKS` en las variables del proyecto y pásale a Jeroben el dominio exacto para CORS.
