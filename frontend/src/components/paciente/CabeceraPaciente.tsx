import { ShieldAlert } from "lucide-react";
import type { Paciente } from "@/api/tipos";
import { formatearEdad, formatearFecha, iniciales, nombreCabecera, normalizarTexto, textoSexo } from "@/lib/formatos";
import { cn } from "@/lib/utils";

export const sinAlergias = (alergias: string | null | undefined) =>
  !alergias || normalizarTexto(alergias).startsWith("sin alergias conocidas");

interface Props {
  paciente: Paciente;
  /** Fecha para calcular la edad (la de la consulta en una nota). */
  fechaReferencia?: string;
  flush?: boolean;
  className?: string;
}

/** Cabecera de paciente (DS 7.1): siempre visible mientras hay datos clínicos en pantalla. */
export function CabeceraPaciente({ paciente: p, fechaReferencia, flush, className }: Props) {
  const conAlergias = !sinAlergias(p.alergias);
  return (
    <div className={cn("pb-wrap", className)}>
      <section className={cn("pb", flush && "flush")} aria-label="Paciente">
        <div className="pb-id">
          <span className="pb-av" aria-hidden="true">
            {iniciales(p)}
          </span>
          <div className="min-w-0">
            <div className="pb-name">{nombreCabecera(p)}</div>
            <div className="pb-sub tnum">
              {textoSexo(p.sexo)} · {formatearEdad(p.fecha_nacimiento, fechaReferencia)} · Exp. <span className="mono">{p.numero_expediente}</span>
            </div>
          </div>
        </div>
        <dl className="pb-meta">
          <div>
            <dt>Nacimiento</dt>
            <dd>{formatearFecha(p.fecha_nacimiento)}</dd>
          </div>
          <div>
            <dt>Expediente</dt>
            <dd className="mono">{p.numero_expediente}</dd>
          </div>
          <div>
            <dt>Tipo de sangre</dt>
            <dd>{p.tipo_sangre || "—"}</dd>
          </div>
        </dl>
        {conAlergias ? (
          <span className="pb-alert">
            <ShieldAlert aria-hidden="true" />
            Alergia: {p.alergias}
          </span>
        ) : (
          <span className="pb-neutral">Sin alergias conocidas</span>
        )}
      </section>
    </div>
  );
}
