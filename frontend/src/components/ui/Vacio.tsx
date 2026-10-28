import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Estado vacío: dice qué aparecerá ahí y cómo empezar (DS 6.9). */
export function Vacio({ icono: Icono, titulo, children, accion }: { icono: LucideIcon; titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="empty">
      <Icono className="h-6 w-6 text-texto-subtle" aria-hidden="true" />
      <b>{titulo}</b>
      {children && <p className="t-body-sm max-w-[48ch]">{children}</p>}
      {accion}
    </div>
  );
}
