// Cliente de la API de Django (docs/equipo/jeroben-backend.md §6). Con USAR_MOCKS responde con src/mocks/.
import { API_URL, CLAVES_STORAGE, usaMock } from "@/config";

export class ErrorApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    /** Rutas de campos que faltan para autorizar, por ejemplo "valoracion.diagnosticos". */
    public readonly faltantes: string[] = [],
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVES_STORAGE.token);
  } catch {
    return null;
  }
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVES_STORAGE.token, token);
}

export function borrarToken(): void {
  try {
    localStorage.removeItem(CLAVES_STORAGE.token);
  } catch {
    // Nada que borrar.
  }
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: "Revisa los datos e intenta de nuevo.",
  403: "No tienes permiso para hacer esto.",
  404: "No encontramos lo que buscas.",
  409: "Los datos cambiaron mientras trabajabas. Recarga para ver la versión vigente.",
  413: "El archivo es demasiado grande.",
  500: "El servidor tuvo un error. Intenta de nuevo en unos segundos.",
  502: "El servicio de IA no respondió bien. Tu audio sigue aquí: puedes reintentar.",
  504: "El procesamiento tardó demasiado. Tu audio sigue aquí: puedes reintentar.",
};

interface Opciones {
  metodo?: "GET" | "POST" | "PATCH";
  cuerpo?: unknown;
  signal?: AbortSignal;
}

/**
 * Hace una petición a la API: antepone API_URL, agrega el token y convierte los errores HTTP
 * ({ error: { codigo, mensaje } }) en ErrorApi. Con 401 borra la sesión y lleva a /login.
 */
export async function pedir<T>(ruta: string, { metodo = "GET", cuerpo, signal }: Opciones = {}): Promise<T> {
  const token = leerToken();
  const recurso = ruta.split("?")[0].split("/")[2] ?? "";
  const esFormData = typeof FormData !== "undefined" && cuerpo instanceof FormData;

  let respuesta: Response;
  try {
    if (usaMock(recurso)) {
      const { responderMock } = await import("@/api/mocks");
      respuesta = await responderMock(metodo, ruta, cuerpo, token, signal);
    } else {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (cuerpo !== undefined && !esFormData) headers["Content-Type"] = "application/json";
      respuesta = await fetch(`${API_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo === undefined ? undefined : esFormData ? (cuerpo as FormData) : JSON.stringify(cuerpo),
        signal,
      });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ErrorApi(0, "sin_conexion", "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
  }

  if (respuesta.status === 401 && !ruta.startsWith("/api/auth/login")) {
    borrarToken();
    if (window.location.pathname !== "/login") window.location.assign("/login?sesion=expirada");
    throw new ErrorApi(401, "sesion_expirada", "Tu sesión terminó. Vuelve a iniciar sesión.");
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = (datos as { error?: { codigo?: string; mensaje?: string; faltantes?: string[]; detalles?: unknown } } | null)?.error;
    throw new ErrorApi(
      respuesta.status,
      error?.codigo ?? "error",
      error?.mensaje ?? MENSAJES_POR_ESTADO[respuesta.status] ?? "Algo salió mal. Intenta de nuevo.",
      Array.isArray(error?.faltantes) ? error.faltantes : [],
      error?.detalles,
    );
  }
  return datos as T;
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Algo salió mal. Intenta de nuevo.";
}
