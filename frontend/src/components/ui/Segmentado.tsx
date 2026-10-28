import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface OpcionSegmentado<T extends string> {
  valor: T;
  etiqueta: string;
}

interface Props<T extends string> {
  etiqueta: string;
  /** Oculta la etiqueta visualmente (sigue disponible para lectores de pantalla). */
  ocultarEtiqueta?: boolean;
  opciones: OpcionSegmentado<T>[];
  valor: T | null;
  onCambio: (valor: T) => void;
  deshabilitado?: boolean;
  chico?: boolean;
  className?: string;
  id?: string;
}

/** Control segmentado del DS (6.3): radios con color, icono y palabra. */
export function Segmentado<T extends string>({
  etiqueta,
  ocultarEtiqueta,
  opciones,
  valor,
  onCambio,
  deshabilitado,
  chico,
  className,
  id,
}: Props<T>) {
  const nombre = useId();
  return (
    <fieldset className={cn("grid gap-1.5", className)} id={id}>
      <legend className={ocultarEtiqueta ? "sr-only" : "field-label mb-1.5"}>{etiqueta}</legend>
      <div className={cn("seg", chico && "seg-sm")}>
        {opciones.map((o) => (
          <label key={o.valor}>
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={valor === o.valor}
              disabled={deshabilitado}
              onChange={() => onCambio(o.valor)}
            />
            <Check className="seg-ic" aria-hidden="true" />
            {o.etiqueta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
