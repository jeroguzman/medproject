// Reglas sobre el contenido del formato: valores vacíos, origen de cada campo, resumen y obligatorios.
import { normalizarTexto } from "@/lib/formatos";
import { FORMATO_CLINICO_GENERAL, type CampoConfig } from "@/plantilla/formatoClinicoGeneral";
import type {
  CampoPresion,
  CampoTexto,
  CampoVital,
  Contenido,
  Diagnostico,
  Medicamento,
  Origen,
  ValorCampo,
} from "@/plantilla/valores";

export interface CampoRef {
  seccionId: string;
  numero: string;
  tituloSeccion: string;
  grupo: string;
  campo: CampoConfig;
  /** "grupo.clave", la misma ruta que usan las alertas y los faltantes de la API. */
  ruta: string;
}

/** Todos los campos del formato, en orden. Incluye el IMC, que se muestra pero no se guarda. */
export const CAMPOS: CampoRef[] = FORMATO_CLINICO_GENERAL.flatMap((s) =>
  s.grupos.flatMap((g) =>
    g.campos.map((campo) => ({
      seccionId: s.id,
      numero: s.numero,
      tituloSeccion: s.titulo,
      grupo: g.clave,
      campo,
      ruta: `${g.clave}.${campo.clave}`,
    })),
  ),
);

/** Campos que sí viven en el contenido (todo menos el IMC). */
export const CAMPOS_GUARDADOS = CAMPOS.filter((c) => c.campo.tipo !== "imc");

export function campoPorRuta(ruta: string): CampoRef | undefined {
  const base = ruta.replace(/\[\d+\]$/, "");
  return CAMPOS.find((c) => c.ruta === base);
}

/** Id del elemento del DOM de cada campo, para llevar el foco desde los faltantes y las alertas. */
export const idCampo = (ruta: string) => `campo-${ruta.replace(/\[\d+\]$/, "")}`;

export function valorVacio(campo: CampoConfig): ValorCampo {
  switch (campo.tipo) {
    case "vital":
      return { valor: null, unidad: campo.unidad, estado: "sin_informacion", evidencia: null };
    case "presion":
      return { valor: null, unidad: campo.unidad ?? "mmHg", estado: "sin_informacion", evidencia: null };
    case "diagnosticos":
    case "medicamentos":
      return [];
    default:
      return { valor: null, estado: "sin_informacion", evidencia: null };
  }
}

export function contenidoVacio(): Contenido {
  const contenido: Contenido = {};
  for (const ref of CAMPOS_GUARDADOS) {
    contenido[ref.grupo] ??= {};
    contenido[ref.grupo][ref.campo.clave] = valorVacio(ref.campo);
  }
  return contenido;
}

const esTexto = (v: unknown): v is string => typeof v === "string";
const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const evidenciaValida = (e: unknown): string[] | null =>
  Array.isArray(e) ? e.filter(esTexto).filter((t) => t.trim() !== "") : null;
const origenValido = (o: unknown): Origen | undefined => (o === "ia" || o === "editado" || o === "manual" ? o : undefined);
const textoONull = (v: unknown): string | null => (esTexto(v) && v.trim() !== "" ? v : null);

/**
 * Devuelve un valor bien formado para el campo. Nunca falla: si algo no cumple la forma, queda vacío.
 * Se usa con lo que llega de la IA, de la API o de localStorage.
 */
export function sanearValor(campo: CampoConfig, valor: unknown): ValorCampo {
  const vacio = valorVacio(campo);
  if (campo.tipo === "diagnosticos") {
    if (!Array.isArray(valor)) return vacio;
    return valor
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => {
        const condicion = r.condicion;
        const dx: Diagnostico = {
          descripcion: esTexto(r.descripcion) ? r.descripcion : "",
          condicion: condicion === "confirmado" || condicion === "presuntivo" || condicion === "por_determinar" ? condicion : null,
          evidencia: evidenciaValida(r.evidencia),
        };
        if (esTexto(r.cie10)) dx.cie10 = r.cie10;
        const origen = origenValido(r.origen);
        if (origen) dx.origen = origen;
        return dx;
      });
  }
  if (campo.tipo === "medicamentos") {
    if (!Array.isArray(valor)) return vacio;
    return valor
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => {
        const rx: Medicamento = {
          medicamento: esTexto(r.medicamento) ? r.medicamento : "",
          dosis: textoONull(r.dosis),
          via: textoONull(r.via),
          frecuencia: textoONull(r.frecuencia),
          duracion: textoONull(r.duracion),
          evidencia: evidenciaValida(r.evidencia),
        };
        const origen = origenValido(r.origen);
        if (origen) rx.origen = origen;
        return rx;
      });
  }
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return vacio;
  const v = valor as Record<string, unknown>;
  const origen = origenValido(v.origen);
  const conOrigen = <T extends object>(obj: T): T => (origen ? { ...obj, origen } : obj);

  if (campo.tipo === "vital") {
    const numero = esNumero(v.valor) ? v.valor : null;
    const estado = v.estado === "medido" || v.estado === "referido" ? v.estado : "sin_informacion";
    return conOrigen<CampoVital>({
      valor: numero,
      unidad: campo.unidad,
      estado: numero === null ? "sin_informacion" : estado === "sin_informacion" ? "medido" : estado,
      evidencia: evidenciaValida(v.evidencia),
    });
  }
  if (campo.tipo === "presion") {
    const p = v.valor && typeof v.valor === "object" ? (v.valor as Record<string, unknown>) : null;
    const sistolica = p && esNumero(p.sistolica) ? p.sistolica : null;
    const diastolica = p && esNumero(p.diastolica) ? p.diastolica : null;
    const hayValor = sistolica !== null || diastolica !== null;
    const estado = v.estado === "medido" || v.estado === "referido" ? v.estado : "sin_informacion";
    return conOrigen<CampoPresion>({
      valor: hayValor ? { sistolica, diastolica } : null,
      unidad: campo.unidad ?? "mmHg",
      estado: !hayValor ? "sin_informacion" : estado === "sin_informacion" ? "medido" : estado,
      evidencia: evidenciaValida(v.evidencia),
    });
  }
  const texto = esTexto(v.valor) ? v.valor : null;
  const estado = v.estado === "referido" || v.estado === "negado" ? v.estado : "sin_informacion";
  return conOrigen<CampoTexto>({
    valor: texto,
    // Un texto sin estado se toma como referido; un estado sin texto se respeta mientras se captura.
    estado: texto && texto.trim() !== "" && estado === "sin_informacion" ? "referido" : estado,
    evidencia: evidenciaValida(v.evidencia),
  });
}

/** Completa y sanea un contenido: agrega los campos que falten y quita las claves desconocidas. */
export function completarContenido(contenido: unknown): Contenido {
  const fuente = contenido && typeof contenido === "object" ? (contenido as Record<string, Record<string, unknown>>) : {};
  const resultado: Contenido = {};
  for (const ref of CAMPOS_GUARDADOS) {
    resultado[ref.grupo] ??= {};
    resultado[ref.grupo][ref.campo.clave] = sanearValor(ref.campo, fuente[ref.grupo]?.[ref.campo.clave]);
  }
  return resultado;
}

export function obtenerValor(contenido: Contenido, ref: CampoRef): ValorCampo {
  return contenido[ref.grupo]?.[ref.campo.clave] ?? valorVacio(ref.campo);
}

export function estaVacio(valor: ValorCampo): boolean {
  if (Array.isArray(valor)) return valor.length === 0;
  if (valor.valor === null || valor.valor === undefined) return true;
  if (typeof valor.valor === "string") return valor.valor.trim() === "";
  if (typeof valor.valor === "object") return valor.valor.sistolica === null && valor.valor.diastolica === null;
  return false;
}

/**
 * Origen después de que el médico edita (prompt 6): lo de la IA pasa a "editado" y lo vacío a "manual".
 * Si el médico vacía un campo que capturó a mano, vuelve a no tener origen, para que otro audio pueda llenarlo.
 */
export function origenTrasEditar(anterior: Origen | undefined, quedaVacio: boolean): Origen | undefined {
  if (anterior === "ia" || anterior === "editado") return "editado";
  if (quedaVacio) return undefined;
  return "manual";
}

/** Aplica la regla de origen a un campo simple editado por el médico. */
export function conOrigenEditado<T extends CampoTexto | CampoVital | CampoPresion>(anterior: T, nuevo: T): T {
  const origen = origenTrasEditar(anterior.origen, estaVacio(nuevo));
  const { origen: _ignorado, ...resto } = nuevo;
  return (origen ? { ...resto, origen } : resto) as T;
}

export interface Resumen {
  iaSinCambios: number;
  editados: number;
  manuales: number;
  vacios: number;
}

/** Resumen de la sección 09: cuántos campos o renglones vienen de la IA sin cambios, editados, manuales y vacíos. */
export function resumirContenido(contenido: Contenido): Resumen {
  const r: Resumen = { iaSinCambios: 0, editados: 0, manuales: 0, vacios: 0 };
  const contar = (origen: Origen | undefined, vacio: boolean) => {
    if (origen === "editado") r.editados += 1;
    else if (vacio) r.vacios += 1;
    else if (origen === "ia") r.iaSinCambios += 1;
    else r.manuales += 1;
  };
  for (const ref of CAMPOS_GUARDADOS) {
    const valor = obtenerValor(contenido, ref);
    if (Array.isArray(valor)) {
      const renglones = (valor as Array<Diagnostico | Medicamento>).filter((row) => !renglonVacio(row));
      if (renglones.length === 0) r.vacios += 1;
      for (const row of renglones) contar(row.origen, false);
    } else {
      contar(valor.origen, estaVacio(valor));
    }
  }
  return r;
}

export function renglonVacio(row: Diagnostico | Medicamento): boolean {
  return "descripcion" in row ? row.descripcion.trim() === "" : row.medicamento.trim() === "";
}

/** Clave para no duplicar renglones al fusionar: descripción o medicamento normalizados. */
export function normalizarClaveRenglon(row: Diagnostico | Medicamento): string {
  return normalizarTexto("descripcion" in row ? row.descripcion : row.medicamento);
}

export interface Faltante {
  /** Ruta del campo ("motivo_padecimiento.motivo_consulta") o de la identificación ("identificacion.fecha_consulta"). */
  ruta: string;
  etiqueta: string;
}

interface DatosObligatorios {
  contenido: Contenido;
  identificacion?: { fecha_consulta: string; hora_atencion: string; tipo_consulta: string | null };
  modoCaptura?: string | null;
  consentimiento?: boolean;
}

/** Campos obligatorios para autorizar (P-04). La regla que vale es la del backend; esta la repite para avisar antes. */
export function calcularFaltantes({ contenido, identificacion, modoCaptura, consentimiento }: DatosObligatorios): Faltante[] {
  const faltantes: Faltante[] = [];
  if (identificacion) {
    if (!identificacion.fecha_consulta) faltantes.push({ ruta: "identificacion.fecha_consulta", etiqueta: "Fecha de la consulta" });
    if (!identificacion.hora_atencion) faltantes.push({ ruta: "identificacion.hora_atencion", etiqueta: "Hora de atención" });
    if (!identificacion.tipo_consulta) faltantes.push({ ruta: "identificacion.tipo_consulta", etiqueta: "Tipo de consulta" });
  }
  const motivo = contenido.motivo_padecimiento?.motivo_consulta as CampoTexto | undefined;
  if (!motivo || estaVacio(motivo)) faltantes.push({ ruta: "motivo_padecimiento.motivo_consulta", etiqueta: "Motivo de consulta" });
  const padecimiento = contenido.motivo_padecimiento?.padecimiento_actual as CampoTexto | undefined;
  if (!padecimiento || estaVacio(padecimiento)) {
    faltantes.push({ ruta: "motivo_padecimiento.padecimiento_actual", etiqueta: "Padecimiento actual" });
  }

  const diagnosticos = ((contenido.valoracion?.diagnosticos ?? []) as Diagnostico[]).filter((d) => !renglonVacio(d));
  if (!diagnosticos.some((d) => d.condicion)) {
    faltantes.push({ ruta: "valoracion.diagnosticos", etiqueta: "Diagnóstico" });
  }
  diagnosticos.forEach((d, i) => {
    if (!d.condicion) faltantes.push({ ruta: "valoracion.diagnosticos", etiqueta: `Condición del diagnóstico ${i + 1}` });
  });

  const medicamentos = ((contenido.plan?.medicamentos ?? []) as Medicamento[]).filter((m) => !renglonVacio(m));
  const medidas = contenido.plan?.medidas_seguimiento as CampoTexto | undefined;
  if (medicamentos.length === 0 && (!medidas || estaVacio(medidas))) {
    faltantes.push({ ruta: "plan.medicamentos", etiqueta: "Plan: un medicamento o las medidas de seguimiento" });
  }
  if (modoCaptura === "consulta" && !consentimiento) {
    faltantes.push({ ruta: "grabadora", etiqueta: "Consentimiento de grabación del paciente" });
  }
  return faltantes;
}

/**
 * Deja el contenido listo para la API: quita renglones vacíos, recorta textos y alinea valor y estado
 * (un texto vacío queda en sin_informacion). Conserva el origen de cada campo.
 */
export function prepararContenido(contenido: Contenido): Contenido {
  const listo = completarContenido(contenido);
  for (const ref of CAMPOS_GUARDADOS) {
    const valor = listo[ref.grupo][ref.campo.clave];
    if (Array.isArray(valor)) {
      if (ref.campo.tipo === "diagnosticos") {
        listo[ref.grupo][ref.campo.clave] = (valor as Diagnostico[])
          .filter((d) => !renglonVacio(d))
          .map((d) => ({ ...d, descripcion: d.descripcion.trim() }));
      } else {
        listo[ref.grupo][ref.campo.clave] = (valor as Medicamento[])
          .filter((m) => !renglonVacio(m))
          .map((m) => ({
            ...m,
            medicamento: m.medicamento.trim(),
            dosis: m.dosis?.trim() || null,
            via: m.via?.trim() || null,
            frecuencia: m.frecuencia?.trim() || null,
            duracion: m.duracion?.trim() || null,
          }));
      }
      continue;
    }
    if (estaVacio(valor)) {
      listo[ref.grupo][ref.campo.clave] = { ...valor, valor: null, estado: "sin_informacion" } as ValorCampo;
    } else if (typeof valor.valor === "string") {
      listo[ref.grupo][ref.campo.clave] = { ...valor, valor: valor.valor.trim() } as CampoTexto;
    }
  }
  return listo;
}

export function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}
