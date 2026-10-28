import { idCampo } from "@/lib/contenido";

const ENFOCABLES = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])';

/** Lleva al campo (desde los faltantes, las alertas o el botón deshabilitado) y le pone el foco. */
export function irACampo(ruta: string): void {
  const el = document.getElementById(idCampo(ruta));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const objetivo = el.matches(ENFOCABLES) ? el : el.querySelector<HTMLElement>(ENFOCABLES);
  (objetivo ?? el).focus({ preventScroll: true });
}

/** Pasa a la sección siguiente del formulario (Ctrl + Enter, DS 8.1). */
export function irASeccionSiguiente(desde: Element | null): void {
  const secciones = [...document.querySelectorAll<HTMLElement>("section[data-seccion]")];
  if (secciones.length === 0) return;
  const actual = desde?.closest<HTMLElement>("section[data-seccion]");
  const i = actual ? secciones.indexOf(actual) : -1;
  irASeccion(secciones[Math.min(i + 1, secciones.length - 1)]);
}

export function irASeccion(seccion: HTMLElement | null): void {
  if (!seccion) return;
  seccion.scrollIntoView({ behavior: "smooth", block: "start" });
  const objetivo = seccion.querySelector<HTMLElement>(ENFOCABLES) ?? seccion.querySelector<HTMLElement>("h2");
  objetivo?.focus({ preventScroll: true });
}

/** Enter en un signo vital pasa al siguiente, como en una hoja de cálculo (DS 8.1). */
export function irAlSiguienteVital(actual: HTMLElement): void {
  const vitales = [...document.querySelectorAll<HTMLElement>("[data-vital]")];
  const i = vitales.indexOf(actual);
  const siguiente = vitales[i + 1];
  if (siguiente) siguiente.focus();
}
