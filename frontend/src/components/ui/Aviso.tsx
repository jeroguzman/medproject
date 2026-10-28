import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type VarianteAviso = "critical" | "warning" | "success" | "info";

const ICONOS = { critical: OctagonAlert, warning: AlertTriangle, success: CheckCircle2, info: Info };
// Clases completas para que Tailwind no las quite al compilar.
const CLASES: Record<VarianteAviso, string> = {
  critical: "alert-critical",
  warning: "alert-warning",
  success: "alert-success",
  info: "alert-info",
};

interface Props {
  variante: VarianteAviso;
  titulo: ReactNode;
  children?: ReactNode;
  acciones?: ReactNode;
  className?: string;
  id?: string;
}

/** Alerta del DS (6.4). Las críticas usan role="alert"; las demás se anuncian sin interrumpir. */
export function Aviso({ variante, titulo, children, acciones, className, id }: Props) {
  const Icono = ICONOS[variante];
  return (
    <div id={id} className={cn("alert", CLASES[variante], className)} role={variante === "critical" ? "alert" : "status"}>
      <Icono aria-hidden="true" />
      <div className="alert-title">{titulo}</div>
      {children && <div className="alert-body">{children}</div>}
      {acciones && <div className="alert-actions">{acciones}</div>}
    </div>
  );
}
