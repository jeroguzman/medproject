import type { CSSProperties, ReactNode } from "react";
import { useAlto } from "@/hooks/useAlto";

interface Props {
  /** Cabecera fija: cabecera de paciente y barra de la consulta. */
  cabecera: ReactNode;
  indice: ReactNode;
  panel: ReactNode;
  children: ReactNode;
}

/**
 * Distribución de la consulta en escritorio (1366 × 768): índice a la izquierda, formulario al centro
 * (máximo 960 px) y panel de 360 px a la derecha. La cabecera de paciente queda siempre visible.
 */
export function MarcoTrabajo({ cabecera, indice, panel, children }: Props) {
  const [ref, alto] = useAlto<HTMLDivElement>();
  const estilo = { "--alto-cabecera": `${48 + alto}px` } as CSSProperties;
  const columna = "lg:sticky lg:top-[var(--alto-cabecera)] lg:h-[calc(100vh-var(--alto-cabecera))] lg:self-start lg:overflow-y-auto";
  return (
    <div style={estilo}>
      <div ref={ref} className="sticky top-12 z-30 shadow-1">
        {cabecera}
      </div>
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <aside className={`hidden border-r border-border bg-surface lg:block ${columna}`}>{indice}</aside>
        <div className="min-w-0 px-4 py-5">
          <div className="mx-auto grid max-w-[960px] gap-5">{children}</div>
        </div>
        <aside
          aria-label="Transcripción e historial"
          className={`h-[480px] border-t border-border bg-surface lg:col-span-2 xl:col-span-1 xl:sticky xl:top-[var(--alto-cabecera)] xl:h-[calc(100vh-var(--alto-cabecera))] xl:self-start xl:border-l xl:border-t-0`}
        >
          {panel}
        </aside>
      </div>
    </div>
  );
}
