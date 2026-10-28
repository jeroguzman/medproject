import { Check, Lock, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { AlertaVista } from "@/lib/alertas";
import { CAMPOS_GUARDADOS, estaVacio, obtenerValor } from "@/lib/contenido";
import { irASeccion } from "@/lib/navegacion";
import { cn } from "@/lib/utils";
import { FORMATO_CLINICO_GENERAL } from "@/plantilla/formatoClinicoGeneral";
import type { Contenido } from "@/plantilla/valores";

interface Props {
  contenido: Contenido;
  alertas: AlertaVista[];
  faltantes: number;
}

/** Índice de secciones (DS 6.6): muestra el avance pero no obliga a un orden. */
export function IndiceSecciones({ contenido, alertas, faltantes }: Props) {
  const [activa, setActiva] = useState<string>(FORMATO_CLINICO_GENERAL[0].id);

  // La sección activa es la última cuyo inicio ya está en el tercio superior del área visible.
  useEffect(() => {
    let cuadro = 0;
    const calcular = () => {
      cuadro = 0;
      const secciones = [...document.querySelectorAll<HTMLElement>("section[data-seccion]")];
      if (secciones.length === 0) return;
      const cabecera = parseFloat(getComputedStyle(secciones[0]).getPropertyValue("--alto-cabecera")) || 48;
      const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const limite = cabecera + (window.innerHeight - cabecera) * 0.35;
      const pasadas = secciones.filter((sec) => sec.getBoundingClientRect().top <= limite);
      const actual = alFinal ? secciones[secciones.length - 1] : (pasadas[pasadas.length - 1] ?? secciones[0]);
      setActiva(actual.dataset.seccion!);
    };
    const programar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
    };
  }, []);

  return (
    <nav aria-label="Secciones de la nota" className="p-3">
      <p className="t-caption mb-2 px-2 uppercase tracking-wide text-texto-subtle">Secciones</p>
      <ol className="steps">
        {FORMATO_CLINICO_GENERAL.map((s) => {
          const grupos = s.grupos.map((g) => g.clave);
          const campos = CAMPOS_GUARDADOS.filter((c) => grupos.includes(c.grupo));
          const llenos = campos.filter((c) => !estaVacio(obtenerValor(contenido, c))).length;
          const conAlerta = alertas.some(
            (a) => !a.resuelta && a.severidad !== "info" && a.campo && grupos.some((g) => a.campo!.startsWith(`${g}.`)),
          );
          const esRevision = s.id === "revision";
          return (
            <li key={s.id}>
              <button
                type="button"
                className={cn("step", llenos > 0 && "done")}
                aria-current={activa === s.id ? "step" : undefined}
                onClick={() => irASeccion(document.getElementById(`seccion-${s.id}`))}
              >
                <span className="step-dot">{llenos > 0 ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : s.numero}</span>
                <span className="min-w-0 flex-1">{s.titulo}</span>
                {!esRevision && campos.length > 0 && (
                  <span className="t-caption tnum text-texto-subtle" aria-label={`${llenos} de ${campos.length} campos con información`}>
                    {llenos}/{campos.length}
                  </span>
                )}
                {conAlerta && <TriangleAlert className="h-4 w-4 text-advertencia-fg" aria-label="Tiene alertas" />}
                {esRevision && faltantes > 0 && <Lock className="h-4 w-4 text-texto-subtle" aria-label={`Faltan ${faltantes} datos para autorizar`} />}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
