import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type VarianteInsignia = "neutral" | "action" | "info" | "success" | "warning" | "critical" | "draft";

// Clases completas para que Tailwind no las quite al compilar (no detecta nombres armados con plantillas).
const CLASES: Record<VarianteInsignia, string> = {
  neutral: "b-neutral",
  action: "b-action",
  info: "b-info",
  success: "b-success",
  warning: "b-warning",
  critical: "b-critical",
  draft: "b-draft",
};

interface Props {
  variante: VarianteInsignia;
  icono?: LucideIcon;
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Insignia de estado (DS 6.5). Todo estado lleva color, icono y palabra. */
export function Insignia({ variante, icono: Icono, children, className, title }: Props) {
  return (
    <span className={cn("badge", CLASES[variante], className)} title={title}>
      {Icono && <Icono aria-hidden="true" />}
      {children}
    </span>
  );
}
