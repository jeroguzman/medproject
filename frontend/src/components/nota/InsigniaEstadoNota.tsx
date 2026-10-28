import { CheckCircle2, FilePen } from "lucide-react";
import { Insignia } from "@/components/ui/Insignia";

/** Estados de la nota (REQUERIMIENTOS §5.2 y DS 6.5). */
export function InsigniaEstadoNota({ estado, version }: { estado: "autorizada" | "corregida"; version: number }) {
  return (
    <Insignia variante="success" icono={CheckCircle2}>
      {estado === "corregida" ? `Corregida · v${version}` : "Autorizada"}
    </Insignia>
  );
}

export function InsigniaBorrador({ texto }: { texto: string }) {
  return (
    <Insignia variante="draft" icono={FilePen}>
      {texto}
    </Insignia>
  );
}
