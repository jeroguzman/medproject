import { CircleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { formatearEdad, formatearFecha, leerFechaUsuario } from "@/lib/formatos";
import { cn } from "@/lib/utils";

interface Props {
  etiqueta: string;
  obligatorio?: boolean;
  /** "AAAA-MM-DD" o "" */
  valor: string;
  onCambio: (iso: string) => void;
  /** Muestra la edad calculada (registro de paciente). */
  mostrarEdad?: boolean;
  /** Fecha máxima permitida en "AAAA-MM-DD". */
  maxima?: string;
  id?: string;
  className?: string;
  compacto?: boolean;
}

/** Fecha en formato DD/mmm/AAAA (DS §11). Acepta también 12/03/1992 y la convierte. */
export function CampoFecha({ etiqueta, obligatorio, valor, onCambio, mostrarEdad, maxima, id, className, compacto }: Props) {
  const idPropio = useId();
  const idInput = id ?? idPropio;
  const [texto, setTexto] = useState(valor ? formatearFecha(valor) : "");
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (valor && leerFechaUsuario(texto) !== valor) setTexto(formatearFecha(valor));
    // Solo cuando cambia el valor desde fuera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const leida = leerFechaUsuario(texto);
  const futura = leida && maxima ? leida > maxima : false;
  const error = tocado && texto.trim() !== "" && (!leida || futura);

  return (
    <div className={cn("field", compacto && "gap-0.5", error && "is-error", className)}>
      <label htmlFor={idInput} className={cn("field-label", compacto && "t-caption text-texto-muted")}>
        {etiqueta}
        {obligatorio && <span className="req" aria-hidden="true">*</span>}
      </label>
      <input
        id={idInput}
        className={cn("input tnum", compacto && "!min-h-control-sm", error && "is-error")}
        placeholder="DD/mmm/AAAA"
        value={texto}
        required={obligatorio}
        aria-invalid={error || undefined}
        aria-describedby={`${idInput}-ayuda`}
        autoComplete="off"
        onChange={(e) => {
          setTexto(e.target.value);
          const iso = leerFechaUsuario(e.target.value);
          if (iso && !(maxima && iso > maxima)) onCambio(iso);
          else if (e.target.value.trim() === "") onCambio("");
        }}
        onBlur={() => {
          setTocado(true);
          if (leida && !futura) setTexto(formatearFecha(leida));
        }}
      />
      <div id={`${idInput}-ayuda`} aria-live="polite">
        {error ? (
          <p className="msg msg-error">
            <CircleAlert aria-hidden="true" />
            {futura ? "La fecha no puede ser futura." : "Escribe la fecha como 12/mar/1992 o 12/03/1992."}
          </p>
        ) : mostrarEdad && leida ? (
          <p className="help tnum">
            {formatearFecha(leida)} · {formatearEdad(leida)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
