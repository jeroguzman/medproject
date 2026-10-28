import { History } from "lucide-react";
import type { VersionNota } from "@/api/tipos";
import { formatearFechaHora } from "@/lib/formatos";
import { cn } from "@/lib/utils";

interface Props {
  versiones: VersionNota[];
  vigente: number;
  seleccionada: number;
  onSeleccionar: (numero: number) => void;
}

/** Versiones de la nota con número, fecha, autor y motivo (RF-36). Las anteriores se ven en solo lectura. */
export function PanelVersiones({ versiones, vigente, seleccionada, onSeleccionar }: Props) {
  const ordenadas = [...versiones].sort((a, b) => b.numero - a.numero);
  return (
    <ol className="grid gap-2 p-4" aria-label="Versiones de la nota">
      {ordenadas.map((v) => (
        <li key={v.numero}>
          <button
            type="button"
            aria-pressed={seleccionada === v.numero}
            onClick={() => onSeleccionar(v.numero)}
            className={cn(
              "grid w-full gap-1 rounded-md border p-3 text-left",
              seleccionada === v.numero ? "border-accion bg-accion-subtle" : "border-border bg-surface hover:bg-surface-hover",
            )}
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-texto-muted" aria-hidden="true" />
              <b>Versión {v.numero}</b>
              {v.numero === vigente ? <span className="badge b-success">Vigente</span> : <span className="badge b-neutral">Anterior</span>}
            </span>
            <span className="t-body-sm tnum text-texto-muted">{formatearFechaHora(v.autorizada_en)}</span>
            <span className="t-body-sm">{v.autorizada_por}</span>
            <span className="t-body-sm text-texto-muted">{v.motivo_cambio ? `Motivo: ${v.motivo_cambio}` : "Autorización original"}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
