import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { InsigniaBorrador } from "@/components/nota/InsigniaEstadoNota";
import type { EstadoGuardado as Estado } from "@/hooks/useDocumentoLocal";
import { EstadoGuardado } from "./EstadoGuardado";

interface Props {
  children: ReactNode;
  insignia: string;
  estado: Estado;
  guardadoEn: Date | null;
  textoDescartar: string;
  onDescartar: () => void;
}

/** Barra bajo la cabecera de paciente: datos de la atención y el aviso permanente de borrador local. */
export function BarraTrabajo({ children, insignia, estado, guardadoEn, textoDescartar, onDescartar }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-border bg-surface px-4 py-1.5">
      {children}
      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="grid justify-items-end gap-0.5">
          <InsigniaBorrador texto={insignia} />
          <EstadoGuardado estado={estado} guardadoEn={guardadoEn} />
        </div>
        <button type="button" className="btn btn-critical-ghost btn-sm" onClick={onDescartar}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {textoDescartar}
        </button>
      </div>
    </div>
  );
}
