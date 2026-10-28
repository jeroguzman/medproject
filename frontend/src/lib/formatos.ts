// Formatos de datos del DS §11: fecha DD/mmm/AAAA, hora de 24 h, punto decimal y "—" para lo que falta.

export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
export const ZONA_HORARIA = "America/Mexico_City";
export const FALTANTE = "—";

const dos = (n: number) => String(n).padStart(2, "0");

/**
 * Convierte "AAAA-MM-DD" en una fecha local. Ojo: new Date("1992-03-12") se interpreta en UTC
 * y en México muestra el 11 de marzo, por eso se separa en año, mes y día.
 */
export function fechaLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(a, mes - 1, d);
  if (fecha.getFullYear() !== a || fecha.getMonth() !== mes - 1 || fecha.getDate() !== d) return null;
  return fecha;
}

export function aISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** "1992-03-12" → "12/mar/1992" */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return FALTANTE;
  const f = fechaLocal(iso);
  if (!f) return FALTANTE;
  return `${dos(f.getDate())}/${MESES[f.getMonth()]}/${f.getFullYear()}`;
}

/** "2026-11-03" → "mar 03/nov/2026" */
export function formatearFechaCita(iso: string | null | undefined): string {
  if (!iso) return FALTANTE;
  const f = fechaLocal(iso);
  if (!f) return FALTANTE;
  return `${DIAS[f.getDay()]} ${formatearFecha(iso)}`;
}

/** Partes de fecha y hora en la zona de México, para no depender de la zona del navegador. */
function partesEnMexico(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return {
    fecha: `${valor("year")}-${valor("month")}-${valor("day")}`,
    hora: `${valor("hour")}:${valor("minute")}`,
  };
}

/** "2026-10-28T10:52:00-06:00" → "28/oct/2026 · 10:52" */
export function formatearFechaHora(isoConZona: string | null | undefined): string {
  if (!isoConZona) return FALTANTE;
  const fecha = new Date(isoConZona);
  if (Number.isNaN(fecha.getTime())) return FALTANTE;
  const p = partesEnMexico(fecha);
  return `${formatearFecha(p.fecha)} · ${p.hora}`;
}

/** "HH:MM" de un momento dado, en la hora de México. */
export function horaEnMexico(fecha: Date): string {
  return partesEnMexico(fecha).hora;
}

/** Fecha y hora actuales en México: { fecha: "AAAA-MM-DD", hora: "HH:MM" }. */
export function ahoraEnMexico(): { fecha: string; hora: string } {
  return partesEnMexico(new Date());
}

/** "10:30:00" o "10:30" → "10:30" (24 h). */
export function formatearHora(hora: string | null | undefined): string {
  if (!hora) return FALTANTE;
  const m = /^(\d{1,2}):(\d{2})/.exec(hora);
  return m ? `${dos(Number(m[1]))}:${m[2]}` : FALTANTE;
}

export interface Edad {
  valor: number;
  unidad: "años" | "meses" | "días";
}

/** Años; meses si tiene menos de 2 años; días si tiene menos de 1 mes. */
export function calcularEdad(fechaNacimiento: string, fechaReferencia?: string): Edad | null {
  const nac = fechaLocal(fechaNacimiento);
  const ref = fechaReferencia ? fechaLocal(fechaReferencia) : fechaLocal(ahoraEnMexico().fecha);
  if (!nac || !ref || ref < nac) return null;
  let meses = (ref.getFullYear() - nac.getFullYear()) * 12 + (ref.getMonth() - nac.getMonth());
  if (ref.getDate() < nac.getDate()) meses -= 1;
  if (meses < 1) {
    const dias = Math.round((ref.getTime() - nac.getTime()) / 86_400_000);
    return { valor: dias, unidad: "días" };
  }
  if (meses < 24) return { valor: meses, unidad: "meses" };
  return { valor: Math.floor(meses / 12), unidad: "años" };
}

/** "34 años", "18 meses", "12 días"; con corta: "34 a", "18 m", "12 d" (para tablas). */
export function formatearEdad(fechaNacimiento: string, fechaReferencia?: string, corta = false): string {
  const edad = calcularEdad(fechaNacimiento, fechaReferencia);
  if (!edad) return FALTANTE;
  if (corta) return `${edad.valor} ${edad.unidad[0]}`;
  const singular = { años: "año", meses: "mes", días: "día" }[edad.unidad];
  return `${edad.valor} ${edad.valor === 1 ? singular : edad.unidad}`;
}

export function edadEnAnios(fechaNacimiento: string, fechaReferencia?: string): number | null {
  const edad = calcularEdad(fechaNacimiento, fechaReferencia);
  if (!edad) return null;
  return edad.unidad === "años" ? edad.valor : edad.unidad === "meses" ? edad.valor / 12 : 0;
}

interface NombrePersona {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
}

/** → "GARCÍA LÓPEZ, María Fernanda" (cabecera y listas, DS D5). */
export function nombreCabecera(p: NombrePersona): string {
  const apellidos = [p.apellido_paterno, p.apellido_materno].filter(Boolean).join(" ").toLocaleUpperCase("es-MX");
  return `${apellidos}, ${p.nombres}`;
}

/** → "María Fernanda García López" (orden natural). */
export function nombreNatural(p: NombrePersona): string {
  return [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(" ");
}

export function iniciales(p: NombrePersona): string {
  return `${p.nombres.trim()[0] ?? ""}${p.apellido_paterno.trim()[0] ?? ""}`.toLocaleUpperCase("es-MX");
}

export function textoSexo(sexo: string): string {
  return { mujer: "Mujer", hombre: "Hombre", no_especificado: "No especificado" }[sexo] ?? FALTANTE;
}

export function textoTipoConsulta(tipo: string): string {
  return { primera_vez: "Primera vez", seguimiento: "Seguimiento" }[tipo] ?? FALTANTE;
}

export function textoModoCaptura(modo: string | null | undefined): string {
  return modo ? ({ dictado: "Dictado", consulta: "Consulta" }[modo] ?? FALTANTE) : FALTANTE;
}

/** Punto decimal siempre y sin ceros de relleno: 38.40 → "38.4". */
export function formatearNumero(n: number | null | undefined, decimales = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return FALTANTE;
  return String(Number(n.toFixed(decimales)));
}

/** "38,4" o "38.4" → 38.4; texto vacío → null; inválido → NaN. Acepta coma del teclado numérico (DS 8.1). */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return null;
  if (!/^-?\d+(\.\d+)?\.?$/.test(limpio)) return Number.NaN;
  return Number(limpio);
}

/** "mm:ss" para el tiempo de grabación. */
export function formatearDuracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${dos(Math.floor(s / 60))}:${dos(s % 60)}`;
}

/** Minúsculas, sin acentos ni puntuación y con espacios simples, para comparar y buscar. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lee una fecha escrita por el médico: "12/mar/1992", "12/03/1992", "12-03-1992" o "1992-03-12".
 * Devuelve "AAAA-MM-DD" o null.
 */
export function leerFechaUsuario(texto: string): string | null {
  const t = texto.trim().toLowerCase();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) return validarFecha(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[/\-. ]([a-zé]{3,})\.?[/\-. ](\d{4})$/.exec(t);
  if (m) {
    const mes = MESES.findIndex((nombre) => normalizarTexto(m![2]).startsWith(nombre)) + 1;
    return mes > 0 ? validarFecha(Number(m[3]), mes, Number(m[1])) : null;
  }
  m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(t);
  if (m) return validarFecha(Number(m[3]), Number(m[2]), Number(m[1]));
  return null;
}

function validarFecha(a: number, mes: number, d: number): string | null {
  const iso = `${a}-${dos(mes)}-${dos(d)}`;
  return fechaLocal(iso) ? iso : null;
}

/** "9:5" o "0905" → "09:05"; inválida → null. */
export function leerHora(texto: string): string | null {
  const m = /^(\d{1,2}):?(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 23 || min > 59) return null;
  return `${dos(h)}:${dos(min)}`;
}
