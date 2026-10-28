import { Quote } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useEvidencia } from "@/components/consulta/ContextoEvidencia";
import { cn } from "@/lib/utils";

interface Props {
  citas: string[] | null | undefined;
  /** Solo hay evidencia que mostrar en lo que llenó la IA (aunque después se haya editado). */
  activa: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Al enfocar un campo de la IA o pasar el cursor encima, muestra las citas del audio en un popover con
 * "Ver en la transcripción" (VC-19). Al enfocarlo, también se resaltan en el panel derecho.
 */
export function ZonaEvidencia({ citas, activa, children, className, id }: Props) {
  const { enfocar, ver } = useEvidencia();
  const [hover, setHover] = useState(false);
  const [foco, setFoco] = useState(false);
  const [abajo, setAbajo] = useState(false);
  const zona = useRef<HTMLDivElement>(null);
  const cierre = useRef<number | null>(null);
  const hayCitas = activa && !!citas && citas.length > 0;
  const abierto = hayCitas && (hover || foco);

  // Si arriba del campo no cabe (por la cabecera fija), el popover se abre hacia abajo.
  const ubicar = () => {
    const el = zona.current;
    if (!el) return;
    const cabecera = parseFloat(getComputedStyle(el).getPropertyValue("--alto-cabecera")) || 48;
    setAbajo(el.getBoundingClientRect().top - cabecera < 180);
  };
  const entrar = () => {
    if (cierre.current !== null) window.clearTimeout(cierre.current);
    if (!hover) ubicar();
    setHover(true);
  };
  const salir = () => {
    cierre.current = window.setTimeout(() => setHover(false), 180);
  };

  return (
    <div
      ref={zona}
      id={id}
      tabIndex={id ? -1 : undefined}
      className={cn("relative", className)}
      onMouseEnter={hayCitas ? entrar : undefined}
      onMouseLeave={hayCitas ? salir : undefined}
      onFocus={() => {
        if (!hayCitas) return;
        if (!foco && !hover) ubicar();
        setFoco(true);
        enfocar(citas!);
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setFoco(false);
        if (hayCitas) enfocar(null);
      }}
    >
      {children}
      {abierto && (
        <div
          role="note"
          aria-label="Evidencia en el audio"
          className={cn(
            "absolute right-0 z-[25] w-[min(440px,100%)] rounded-md border border-border bg-surface-raised p-3 shadow-2",
            abajo ? "top-full mt-1" : "bottom-full mb-1",
          )}
        >
          <p className="t-caption mb-2 flex items-center gap-1.5 uppercase tracking-wide text-texto-subtle">
            <Quote className="h-3.5 w-3.5" aria-hidden="true" />
            Lo que se dijo en el audio
          </p>
          <ul className="grid gap-1.5">
            {citas!.map((c, i) => (
              <li key={i} className="t-body-sm border-l-2 border-accion-subtle-border pl-2 italic text-texto">
                «{c}»
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => ver(citas!)}>
            Ver en la transcripción
          </button>
        </div>
      )}
    </div>
  );
}
