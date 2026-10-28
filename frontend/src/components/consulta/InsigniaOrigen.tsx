import { Pencil, Sparkles } from "lucide-react";
import { Insignia } from "@/components/ui/Insignia";
import type { Origen } from "@/plantilla/valores";

/** Origen del campo (RF-24): "IA" informativa o "Editado" neutra. Los campos manuales no llevan insignia. */
export function InsigniaOrigen({ origen }: { origen?: Origen }) {
  if (origen === "ia")
    return (
      <Insignia variante="info" icono={Sparkles} title="Lo llenó la IA con el audio y no lo has cambiado">
        IA
      </Insignia>
    );
  if (origen === "editado")
    return (
      <Insignia variante="neutral" icono={Pencil} title="Cambiaste el valor que propuso la IA">
        Editado
      </Insignia>
    );
  return null;
}
