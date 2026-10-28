// Configuración del frontend. Se lee de las variables de entorno de Vite (.env o del hosting).

/** URL de la API de Django, sin diagonal final. */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

/** Recursos de la API: el primer segmento después de /api/. */
export type Recurso = "auth" | "pacientes" | "notas" | "ia" | "plantillas";

const valorMocks = (import.meta.env.VITE_USAR_MOCKS ?? "").trim().toLowerCase();

// VITE_USAR_MOCKS acepta true, false o una lista de recursos ("ia,notas") para pasar a la API real
// pantalla por pantalla. Sin valor, se usan los datos de ejemplo mientras no haya API_URL.
const recursosConMock: Set<Recurso> | "todos" | "ninguno" =
  valorMocks === "true"
    ? "todos"
    : valorMocks === "false"
      ? "ninguno"
      : valorMocks === ""
        ? API_URL === ""
          ? "todos"
          : "ninguno"
        : new Set(valorMocks.split(",").map((r) => r.trim()) as Recurso[]);

/** true si al menos un recurso responde con los archivos de src/mocks/. */
export const USAR_MOCKS: boolean = recursosConMock !== "ninguno";

export function usaMock(recurso: string): boolean {
  if (recursosConMock === "todos") return true;
  if (recursosConMock === "ninguno") return false;
  return recursosConMock.has(recurso as Recurso);
}

/** Límites de la grabadora (RF-11, RF-12) y del procesamiento (RNF-07). */
export const LIMITES = {
  duracionAudioS: 20 * 60,
  tamanoAudioBytes: 50 * 1024 * 1024,
  timeoutProcesarMs: 180_000,
  guardadoBorradorMs: 500,
} as const;

export const CLAVES_STORAGE = {
  token: "vozclinica:token",
  prefijoBorrador: "vozclinica:borrador:",
  prefijoCorreccion: "vozclinica:correccion:",
  mockDb: "vozclinica:mock:db",
} as const;
