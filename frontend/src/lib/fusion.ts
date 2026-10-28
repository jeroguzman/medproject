// Fusión de la respuesta de /api/ia/procesar con el borrador (docs/equipo/german-frontend.md §9).
import type { RespuestaProcesar } from "@/api/tipos";
import type { Borrador } from "@/lib/borrador";
import { CAMPOS_GUARDADOS, estaVacio, normalizarClaveRenglon, sanearValor } from "@/lib/contenido";
import type { Diagnostico, Medicamento, ModoCaptura, Segmento, ValorCampo } from "@/plantilla/valores";

export interface DatosAudio {
  modo: ModoCaptura;
  consentimiento: boolean;
}

/**
 * 1. Primer audio: copia los campos de la IA y marca origen "ia" en los que traen información.
 * 2. Audios siguientes: solo llena campos en sin_informacion y sin origen; en las listas agrega renglones nuevos.
 *    Nunca sobrescribe. (Con el borrador vacío, la regla 2 da el mismo resultado que la 1.)
 * 3. Agrega la transcripción con el número de audio.
 * 4. Reemplaza las alertas y conserva las resueltas.
 * 5. modo_captura = "consulta" si algún audio fue de consulta; el consentimiento queda en true si se marcó.
 */
export function fusionarRespuesta(borrador: Borrador, respuesta: RespuestaProcesar, audio: DatosAudio): Borrador {
  const secciones = structuredClone(borrador.secciones);
  const deIa = respuesta.borrador?.secciones ?? {};

  for (const ref of CAMPOS_GUARDADOS) {
    const crudo = (deIa as Record<string, Record<string, unknown>>)[ref.grupo]?.[ref.campo.clave];
    if (crudo === undefined) continue;
    const propuesto = sanearValor(ref.campo, crudo);
    const actual = secciones[ref.grupo][ref.campo.clave];

    if (Array.isArray(propuesto) && Array.isArray(actual)) {
      const existentes = new Set((actual as Array<Diagnostico | Medicamento>).map(normalizarClaveRenglon));
      const nuevos = (propuesto as Array<Diagnostico | Medicamento>)
        .filter((row) => {
          const clave = normalizarClaveRenglon(row);
          if (clave === "" || existentes.has(clave)) return false;
          existentes.add(clave);
          return true;
        })
        .map((row) => ({ ...row, origen: "ia" as const }));
      secciones[ref.grupo][ref.campo.clave] = [...actual, ...nuevos] as ValorCampo;
      continue;
    }
    if (Array.isArray(propuesto) || Array.isArray(actual)) continue;

    const libre = actual.estado === "sin_informacion" && !actual.origen && estaVacio(actual);
    if (!libre) continue;
    if (propuesto.estado === "sin_informacion" || estaVacio(propuesto)) continue;
    secciones[ref.grupo][ref.campo.clave] = { ...propuesto, origen: "ia" } as ValorCampo;
  }

  const numeroAudio = Math.max(0, ...borrador.transcripcion.segmentos.map((s) => s.audio ?? 1)) + 1;
  const segmentosNuevos: Segmento[] = (respuesta.transcripcion?.segmentos ?? []).map((s) => ({
    ...s,
    rol: s.rol ?? (audio.modo === "dictado" ? "medico" : "desconocido"),
    audio: numeroAudio,
  }));
  const textoNuevo = respuesta.transcripcion?.texto?.trim() ?? "";
  const texto = [borrador.transcripcion.texto.trim(), textoNuevo].filter(Boolean).join("\n\n");

  return {
    ...borrador,
    secciones,
    transcripcion: { texto, segmentos: [...borrador.transcripcion.segmentos, ...segmentosNuevos] },
    alertas: Array.isArray(respuesta.alertas) ? respuesta.alertas : [],
    alertas_resueltas: borrador.alertas_resueltas,
    modo_captura: audio.modo === "consulta" || borrador.modo_captura === "consulta" ? "consulta" : "dictado",
    consentimiento_grabacion: borrador.consentimiento_grabacion || audio.consentimiento,
    actualizado_en: new Date().toISOString(),
  };
}
