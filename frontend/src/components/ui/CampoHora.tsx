import { CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { leerHora } from "@/lib/formatos";
import { cn } from "@/lib/utils";

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (hora: string) => void;
  id: string;
  compacto?: boolean;
}

/** Hora siempre en formato de 24 h (DS §11), sin depender del idioma del sistema. */
export function CampoHora({ etiqueta, valor, onCambio, id, compacto }: Props) {
  const [texto, setTexto] = useState(valor);
  const [tocado, setTocado] = useState(false);
  useEffect(() => {
    if (leerHora(texto) !== valor) setTexto(valor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  const error = tocado && texto.trim() !== "" && !leerHora(texto);
  return (
    <div className={cn("field", compacto && "gap-0.5", error && "is-error")}>
      <label htmlFor={id} className={cn("field-label", compacto && "t-caption text-texto-muted")}>
        {etiqueta}
      </label>
      <input
        id={id}
        className={cn("input tnum w-24", compacto && "!min-h-control-sm", error && "is-error")}
        inputMode="numeric"
        placeholder="HH:MM"
        autoComplete="off"
        value={texto}
        aria-invalid={error || undefined}
        onChange={(e) => {
          setTexto(e.target.value);
          const h = leerHora(e.target.value);
          if (h) onCambio(h);
          else if (e.target.value.trim() === "") onCambio("");
        }}
        onBlur={() => {
          setTocado(true);
          const h = leerHora(texto);
          if (h) setTexto(h);
        }}
      />
      {error && (
        <p className="msg msg-error">
          <CircleAlert aria-hidden="true" />
          Usa 24 h, por ejemplo 16:30.
        </p>
      )}
    </div>
  );
}
