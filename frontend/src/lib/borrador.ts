// Borrador de la consulta y copia de trabajo de una corrección. Viven solo en localStorage (D-02):
// nada clínico sale del navegador hasta que el médico autoriza. El audio nunca se guarda aquí.
import type { PlantillaRef } from "@/api/tipos";
import { CLAVES_STORAGE } from "@/config";
import { ahoraEnMexico } from "@/lib/formatos";
import { completarContenido, contenidoVacio } from "@/lib/contenido";
import type { Alerta, Contenido, ModoCaptura, TipoConsulta, Transcripcion } from "@/plantilla/valores";

export const PLANTILLA: PlantillaRef = { clave: "formato_clinico_general", version: "1.1" };

export interface IdentificacionConsulta {
  fecha_consulta: string;
  hora_atencion: string;
  tipo_consulta: TipoConsulta;
}

export interface Borrador {
  version_formato: 1;
  paciente_id: number;
  plantilla: PlantillaRef;
  identificacion: IdentificacionConsulta;
  modo_captura: ModoCaptura | null;
  consentimiento_grabacion: boolean;
  secciones: Contenido;
  transcripcion: Transcripcion;
  alertas: Alerta[];
  /** Ids de alertas resueltas por el médico (por ejemplo "paciente_no_coincide"). */
  alertas_resueltas: string[];
  actualizado_en: string;
}

export interface Correccion {
  version_formato: 1;
  nota_id: number;
  version_base: number;
  secciones: Contenido;
  alertas_resueltas: string[];
  actualizado_en: string;
}

export const claveBorrador = (pacienteId: number | string) => `${CLAVES_STORAGE.prefijoBorrador}${pacienteId}`;
export const claveCorreccion = (notaId: number | string) => `${CLAVES_STORAGE.prefijoCorreccion}${notaId}`;

export function leerLocal<T>(clave: string): T | null {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? (JSON.parse(texto) as T) : null;
  } catch {
    return null;
  }
}

/** Devuelve false si el navegador no dejó guardar (por ejemplo, sin espacio). */
export function guardarLocal(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrarLocal(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Sin acceso a localStorage no hay nada que borrar.
  }
}

function clavesDeTrabajo(): string[] {
  try {
    return Object.keys(localStorage).filter(
      (k) => k.startsWith(CLAVES_STORAGE.prefijoBorrador) || k.startsWith(CLAVES_STORAGE.prefijoCorreccion),
    );
  } catch {
    return [];
  }
}

/** ¿Hay algún borrador o corrección sin autorizar en este equipo? (se pregunta al cerrar sesión). */
export function hayTrabajoSinAutorizar(): boolean {
  return clavesDeTrabajo().length > 0;
}

/** Evento que avisa a las pantallas abiertas que ya no deben volver a guardar su borrador. */
export const EVENTO_DESCARTAR_TODO = "vozclinica:descartar-todo";

export function descartarTodoElTrabajo(): void {
  window.dispatchEvent(new Event(EVENTO_DESCARTAR_TODO));
  for (const clave of clavesDeTrabajo()) borrarLocal(clave);
}

export function existeBorrador(pacienteId: number | string): boolean {
  return leerLocal(claveBorrador(pacienteId)) !== null;
}

export function existeCorreccion(notaId: number | string): boolean {
  return leerLocal(claveCorreccion(notaId)) !== null;
}

export function crearBorrador(pacienteId: number, tieneNotas: boolean): Borrador {
  const ahora = ahoraEnMexico();
  return {
    version_formato: 1,
    paciente_id: pacienteId,
    plantilla: PLANTILLA,
    identificacion: {
      fecha_consulta: ahora.fecha,
      hora_atencion: ahora.hora,
      // Propone "Seguimiento" si el paciente ya tiene notas (REQUERIMIENTOS §7.2).
      tipo_consulta: tieneNotas ? "seguimiento" : "primera_vez",
    },
    modo_captura: null,
    consentimiento_grabacion: false,
    secciones: contenidoVacio(),
    transcripcion: { texto: "", segmentos: [] },
    alertas: [],
    alertas_resueltas: [],
    actualizado_en: new Date().toISOString(),
  };
}

/** Lee un borrador de localStorage y lo sanea; si no es válido, devuelve null. */
export function leerBorrador(pacienteId: number): Borrador | null {
  const datos = leerLocal<Partial<Borrador>>(claveBorrador(pacienteId));
  if (!datos || datos.version_formato !== 1) return null;
  const base = crearBorrador(pacienteId, false);
  return {
    ...base,
    ...datos,
    paciente_id: pacienteId,
    plantilla: PLANTILLA,
    identificacion: { ...base.identificacion, ...datos.identificacion },
    secciones: completarContenido(datos.secciones),
    transcripcion: {
      texto: datos.transcripcion?.texto ?? "",
      segmentos: Array.isArray(datos.transcripcion?.segmentos) ? datos.transcripcion.segmentos : [],
    },
    alertas: Array.isArray(datos.alertas) ? datos.alertas : [],
    alertas_resueltas: Array.isArray(datos.alertas_resueltas) ? datos.alertas_resueltas : [],
  };
}

export function crearCorreccion(notaId: number, versionBase: number, contenido: Contenido): Correccion {
  return {
    version_formato: 1,
    nota_id: notaId,
    version_base: versionBase,
    secciones: completarContenido(contenido),
    alertas_resueltas: [],
    actualizado_en: new Date().toISOString(),
  };
}

export function leerCorreccion(notaId: number): Correccion | null {
  const datos = leerLocal<Partial<Correccion>>(claveCorreccion(notaId));
  if (!datos || datos.version_formato !== 1 || typeof datos.version_base !== "number") return null;
  return {
    version_formato: 1,
    nota_id: notaId,
    version_base: datos.version_base,
    secciones: completarContenido(datos.secciones),
    alertas_resueltas: Array.isArray(datos.alertas_resueltas) ? datos.alertas_resueltas : [],
    actualizado_en: datos.actualizado_en ?? new Date().toISOString(),
  };
}
