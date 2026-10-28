// Alertas del borrador (docs/equipo/german-frontend.md §10).
// Las de la IA llegan en borrador.alertas; las de signos vitales y alergias se recalculan aquí con cada cambio,
// así una corrección del médico las quita o las agrega al momento.
import { CAMPOS, obtenerValor } from "@/lib/contenido";
import { normalizarTexto } from "@/lib/formatos";
import { evaluarPresion, evaluarVital } from "@/lib/vitales";
import type { Alerta, CampoPresion, CampoTexto, CampoVital, Contenido, Medicamento, SeveridadAlerta } from "@/plantilla/valores";

export interface AlertaVista {
  id: string;
  tipo: string;
  severidad: SeveridadAlerta;
  campo: string | null;
  mensaje: string;
  bloquea: boolean;
  resuelta: boolean;
  /** Para valor_imposible: el valor corregido que se puede aplicar con un botón. */
  sugerencia?: number;
}

/** Tipos que el frontend recalcula: los que manda la IA de estos tipos se ignoran para no duplicarlos. */
const TIPOS_LOCALES = new Set(["valor_imposible", "fuera_de_rango", "alergia_medicamento"]);

export const idAlerta = (tipo: string, campo: string | null) => (campo ? `${tipo}:${campo}` : tipo);

export function estaResuelta(resueltas: string[], id: string): boolean {
  return resueltas.some((r) => r === id || r.startsWith(`${id}::`));
}

// Grupos de la guía de Luis §9.6. Cada grupo tiene las palabras que delatan la alergia y los medicamentos del grupo.
const GRUPOS_ALERGIA = [
  {
    nombre: "las penicilinas",
    alergia: ["penicilin", "betalactam"],
    medicamentos: ["penicilina", "amoxicilina", "ampicilina", "dicloxacilina", "bencilpenicilina"],
  },
  {
    nombre: "las sulfas",
    alergia: ["sulfa"],
    medicamentos: ["sulfametoxazol", "trimetoprima con sulfametoxazol", "sulfadiazina"],
  },
  {
    nombre: "los AINE",
    alergia: ["aine", "antiinflamatorio"],
    medicamentos: ["ibuprofeno", "naproxeno", "diclofenaco", "ketorolaco"],
  },
];

/** (C) Revisa cada medicamento del plan contra las alergias del expediente y las que se mencionaron en el audio. */
export function alertasDeAlergia(medicamentos: Medicamento[], alergiasTexto: string[]): Omit<AlertaVista, "resuelta">[] {
  // Se compara por palabra para que "aine" no coincida dentro de otra palabra.
  const mencionaAlergia = (texto: string, raices: string[]) =>
    normalizarTexto(texto)
      .split(" ")
      .some((palabra) => raices.some((r) => palabra.startsWith(r)));
  const textos = alergiasTexto.filter((t) => !normalizarTexto(t).includes("sin alergias conocidas"));
  if (textos.length === 0) return [];
  const alertas: Omit<AlertaVista, "resuelta">[] = [];
  medicamentos.forEach((m, i) => {
    const nombre = normalizarTexto(m.medicamento);
    if (!nombre) return;
    for (const grupo of GRUPOS_ALERGIA) {
      const original = textos.find((t) => mencionaAlergia(t, grupo.alergia));
      const delGrupo = grupo.medicamentos.some((g) => nombre.includes(normalizarTexto(g)));
      if (original && delGrupo) {
        alertas.push({
          id: `alergia_medicamento:${nombre}`,
          tipo: "alergia_medicamento",
          severidad: "critica",
          campo: `plan.medicamentos[${i}]`,
          mensaje: `${m.medicamento} pertenece al grupo de ${grupo.nombre} y el expediente o el audio registran: ${original}.`,
          bloquea: true,
        });
        break;
      }
    }
  });
  return alertas;
}

interface Entrada {
  contenido: Contenido;
  alertasIa: Alerta[];
  resueltas: string[];
  /** Alergias del expediente. */
  alergiasPaciente: string | null;
  esMenor: boolean;
}

export function calcularAlertas({ contenido, alertasIa, resueltas, alergiasPaciente, esMenor }: Entrada): AlertaVista[] {
  const lista: Omit<AlertaVista, "resuelta">[] = [];

  for (const a of alertasIa) {
    if (TIPOS_LOCALES.has(a.tipo)) continue;
    lista.push({ ...a, id: idAlerta(a.tipo, a.tipo === "paciente_no_coincide" ? null : a.campo) });
  }

  for (const ref of CAMPOS) {
    if (ref.campo.tipo !== "vital" && ref.campo.tipo !== "presion") continue;
    const valor = obtenerValor(contenido, ref);
    const ev =
      ref.campo.tipo === "presion"
        ? evaluarPresion(valor as CampoPresion, esMenor)
        : evaluarVital(ref.campo.clave, (valor as CampoVital).valor, esMenor);
    if (ev.nivel === "error") {
      lista.push({
        id: idAlerta("valor_imposible", ref.ruta),
        tipo: "valor_imposible",
        severidad: "critica",
        campo: ref.ruta,
        mensaje: ev.mensaje,
        bloquea: true,
        sugerencia: ev.sugerencia,
      });
    } else if (ev.nivel === "advertencia" || ev.nivel === "critico") {
      lista.push({
        id: idAlerta("fuera_de_rango", ref.ruta),
        tipo: "fuera_de_rango",
        severidad: ev.nivel === "critico" ? "critica" : "advertencia",
        campo: ref.ruta,
        mensaje: ev.mensaje,
        bloquea: false,
      });
    }
  }

  const medicamentos = (contenido.plan?.medicamentos ?? []) as Medicamento[];
  const alergiasAudio = (contenido.antecedentes?.alergias as CampoTexto | undefined)?.valor;
  const textos = [alergiasPaciente, alergiasAudio].filter((t): t is string => !!t && t.trim() !== "");
  lista.push(...alertasDeAlergia(medicamentos, textos));

  return lista.map((a) => ({ ...a, resuelta: estaResuelta(resueltas, a.id) }));
}

/** Alertas que impiden autorizar: las que bloquean y siguen sin resolver. */
export function alertasQueBloquean(alertas: AlertaVista[]): AlertaVista[] {
  return alertas.filter((a) => a.bloquea && !a.resuelta);
}

/** Alertas abiertas para el resumen: todo lo que no es informativo y no se ha resuelto. */
export function alertasAbiertas(alertas: AlertaVista[]): AlertaVista[] {
  return alertas.filter((a) => !a.resuelta && a.severidad !== "info");
}

/** Alertas de un campo (o de sus renglones, si es lista). */
export function alertasDeCampo(alertas: AlertaVista[], ruta: string): AlertaVista[] {
  return alertas.filter((a) => a.campo !== null && (a.campo === ruta || a.campo.startsWith(`${ruta}[`)));
}

/** Texto que se muestra para los avisos informativos de la IA (§10). */
export function textoAviso(alerta: AlertaVista): string {
  if (alerta.tipo === "sin_evidencia") return "La IA propuso un valor sin respaldo en el audio y se descartó.";
  if (alerta.tipo === "unidad_convertida") return alerta.mensaje || "Talla convertida de metros a centímetros.";
  return alerta.mensaje;
}
