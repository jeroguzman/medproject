// Flujo de acceso con Google o Facebook (MojoAuth). El flujo vive solo en esta pestaña:
// un state_id que llegue a otro navegador no sirve sin él.
import { CLAVES_STORAGE } from "@/config";

interface FlujoSocial {
  flujo: string;
  destino: string;
}

const DESTINO_POR_OMISION = "/pacientes";

/** Solo rutas internas de la aplicación; nunca otro origen. */
export function destinoSeguro(destino: unknown): string {
  return typeof destino === "string" && destino.startsWith("/") && !destino.startsWith("//") && !destino.startsWith("/\\")
    ? destino
    : DESTINO_POR_OMISION;
}

/** Devuelve false si el navegador bloquea el almacenamiento de la pestaña. */
export function guardarFlujoSocial(flujo: string, destino: string): boolean {
  try {
    sessionStorage.setItem(CLAVES_STORAGE.flujoSocial, JSON.stringify({ flujo, destino: destinoSeguro(destino) }));
    return true;
  } catch {
    return false;
  }
}

/** Lee y borra el flujo: se usa una sola vez. */
export function tomarFlujoSocial(): FlujoSocial | null {
  try {
    const valor = sessionStorage.getItem(CLAVES_STORAGE.flujoSocial);
    sessionStorage.removeItem(CLAVES_STORAGE.flujoSocial);
    const datos = valor ? (JSON.parse(valor) as Partial<FlujoSocial>) : null;
    if (!datos || typeof datos.flujo !== "string" || !datos.flujo) return null;
    return { flujo: datos.flujo, destino: destinoSeguro(datos.destino) };
  } catch {
    return null;
  }
}
