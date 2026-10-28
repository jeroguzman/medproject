// Validación de signos vitales e IMC (RF-28, VC-21). Rangos de ejemplo sin validación clínica (DS D6),
// los mismos que usan los filtros de Luis (su guía, §9).
import type { CampoPresion, CampoVital } from "@/plantilla/valores";

export type NivelVital = "vacio" | "ok" | "advertencia" | "critico" | "error";

export interface EvaluacionVital {
  nivel: NivelVital;
  mensaje: string;
  /** Valor corregido que se puede ofrecer con un botón (por ejemplo, talla en metros → cm). */
  sugerencia?: number;
}

interface Rango {
  imposibleMin: number;
  imposibleMax: number;
  refMin?: number;
  refMax?: number;
  criticoMenorA?: number;
  decimales: number;
}

export const RANGOS: Record<string, Rango> = {
  sistolica: { imposibleMin: 50, imposibleMax: 300, refMin: 90, refMax: 139, decimales: 0 },
  diastolica: { imposibleMin: 20, imposibleMax: 200, refMin: 60, refMax: 89, decimales: 0 },
  frecuencia_cardiaca: { imposibleMin: 20, imposibleMax: 250, refMin: 60, refMax: 100, decimales: 0 },
  frecuencia_respiratoria: { imposibleMin: 4, imposibleMax: 70, refMin: 12, refMax: 20, decimales: 0 },
  temperatura: { imposibleMin: 30, imposibleMax: 45, refMin: 36.0, refMax: 37.5, decimales: 1 },
  saturacion_o2: { imposibleMin: 50, imposibleMax: 100, refMin: 95, criticoMenorA: 90, decimales: 0 },
  peso: { imposibleMin: 0.5, imposibleMax: 400, decimales: 1 },
  talla: { imposibleMin: 25, imposibleMax: 250, decimales: 0 },
};

const UNIDADES: Record<string, string> = {
  frecuencia_cardiaca: "lpm",
  frecuencia_respiratoria: "rpm",
  temperatura: "°C",
  saturacion_o2: "%",
  peso: "kg",
  talla: "cm",
  presion_arterial: "mmHg",
};

const fmt = (n: number, decimales: number) => n.toFixed(decimales);

function textoReferencia(r: Rango, unidad: string): string {
  if (r.refMin !== undefined && r.refMax !== undefined) return `${fmt(r.refMin, r.decimales)}–${fmt(r.refMax, r.decimales)} ${unidad}`;
  if (r.refMin !== undefined) return `≥ ${fmt(r.refMin, r.decimales)} ${unidad}`;
  return "";
}

/** Evalúa un signo vital numérico. `esMenor` = paciente menor de 18 años: solo se aplican los límites de "imposible". */
export function evaluarVital(clave: string, valor: number | null, esMenor = false): EvaluacionVital {
  if (valor === null) return { nivel: "vacio", mensaje: "— Sin información" };
  if (Number.isNaN(valor)) return { nivel: "error", mensaje: "Escribe solo el número, con punto decimal si hace falta." };
  const r = RANGOS[clave];
  const unidad = UNIDADES[clave] ?? "";
  if (!r) return { nivel: "ok", mensaje: "" };

  if (clave === "talla" && valor > 0 && valor < 3) {
    const cm = Math.round(valor * 100);
    return { nivel: "error", mensaje: `La talla va en centímetros (25–250 cm). ¿Quisiste decir ${cm} cm?`, sugerencia: cm };
  }
  if (clave === "peso" && valor > 400 && valor <= 400_000) {
    const kg = Math.round(valor / 100) / 10;
    return { nivel: "error", mensaje: `El peso va en kilogramos (0.5–400 kg). ¿Quisiste decir ${kg} kg?`, sugerencia: kg };
  }
  if (clave === "temperatura" && valor >= 300 && valor <= 450) {
    const c = valor / 10;
    return { nivel: "error", mensaje: `La temperatura va en °C con punto decimal (30–45 °C). ¿Quisiste decir ${c} °C?`, sugerencia: c };
  }
  if (valor < r.imposibleMin || valor > r.imposibleMax) {
    return {
      nivel: "error",
      mensaje: `${valor} ${unidad} no es un valor posible. Revisa el número: va de ${r.imposibleMin} a ${r.imposibleMax} ${unidad}.`,
    };
  }
  if (esMenor) return { nivel: "ok", mensaje: "Sin rangos de adulto en menores de 18 años" };
  if (r.criticoMenorA !== undefined && valor < r.criticoMenorA) {
    return { nivel: "critico", mensaje: `Crítico (referencia ${textoReferencia(r, unidad)}). Se guardará marcado en la nota.` };
  }
  const bajo = r.refMin !== undefined && valor < r.refMin;
  const alto = r.refMax !== undefined && valor > r.refMax;
  if (bajo || alto) {
    return { nivel: "advertencia", mensaje: `Fuera de rango (${textoReferencia(r, unidad)}). Se guardará marcado en la nota.` };
  }
  return { nivel: "ok", mensaje: "Dentro de rango" };
}

export function evaluarPresion(campo: CampoPresion | undefined, esMenor = false): EvaluacionVital {
  const v = campo?.valor;
  const s = v?.sistolica ?? null;
  const d = v?.diastolica ?? null;
  if (s === null && d === null) return { nivel: "vacio", mensaje: "— Sin información" };
  if (s === null || d === null) {
    return { nivel: "error", mensaje: `Falta la ${s === null ? "sistólica" : "diastólica"}. Escribe los dos valores, por ejemplo 120/80.` };
  }
  const es = evaluarVital("sistolica", s, esMenor);
  if (es.nivel === "error") return { nivel: "error", mensaje: `Sistólica: ${es.mensaje}` };
  const ed = evaluarVital("diastolica", d, esMenor);
  if (ed.nivel === "error") return { nivel: "error", mensaje: `Diastólica: ${ed.mensaje}` };
  if (d >= s) {
    return { nivel: "error", mensaje: "La diastólica debe ser menor que la sistólica. Escribe primero la sistólica (la alta), por ejemplo 120/80." };
  }
  if (es.nivel === "advertencia" || ed.nivel === "advertencia") {
    return { nivel: "advertencia", mensaje: "Fuera de rango (90–139 / 60–89 mmHg). Se guardará marcado en la nota." };
  }
  return es.nivel === "ok" && ed.nivel === "ok" ? { nivel: "ok", mensaje: esMenor ? es.mensaje : "Dentro de rango" } : es;
}

export interface Imc {
  valor: number;
  clasificacion: string | null;
}

/** IMC = peso / talla² con la talla en cm. No se guarda: se calcula al mostrarlo. */
export function calcularImc(peso: CampoVital | undefined, talla: CampoVital | undefined, esMenor = false): Imc | null {
  const p = peso?.valor;
  const t = talla?.valor;
  if (p == null || t == null) return null;
  if (evaluarVital("peso", p).nivel === "error" || evaluarVital("talla", t).nivel === "error") return null;
  const valor = Math.round((p / (t / 100) ** 2) * 10) / 10;
  let clasificacion: string | null = null;
  if (!esMenor) {
    clasificacion = valor < 18.5 ? "Bajo peso" : valor < 25 ? "Normal" : valor < 30 ? "Sobrepeso" : "Obesidad";
  }
  return { valor, clasificacion };
}
