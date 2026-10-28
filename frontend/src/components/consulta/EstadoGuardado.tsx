import { CircleAlert, HardDrive } from "lucide-react";
import type { EstadoGuardado as Estado } from "@/hooks/useDocumentoLocal";
import { horaEnMexico } from "@/lib/formatos";

/** Estado del autoguardado en el navegador (DS 9.1, solo en este equipo). Se anuncia sin interrumpir. */
export function EstadoGuardado({ estado, guardadoEn }: { estado: Estado; guardadoEn: Date | null }) {
  const hora = guardadoEn ? horaEnMexico(guardadoEn) : null;
  return (
    <span className="t-caption flex items-center gap-1.5 text-texto-muted" aria-live="polite">
      {estado === "error" ? (
        <>
          <CircleAlert className="h-4 w-4 text-critico-fg" aria-hidden="true" />
          <span className="text-critico-fg">No se pudo guardar en este equipo</span>
        </>
      ) : guardadoEn ? (
        <>
          <HardDrive className="h-4 w-4" aria-hidden="true" />
          Guardado en este equipo · {hora}
        </>
      ) : (
        <>
          <HardDrive className="h-4 w-4" aria-hidden="true" />
          Se guarda en este equipo al escribir
        </>
      )}
    </span>
  );
}
