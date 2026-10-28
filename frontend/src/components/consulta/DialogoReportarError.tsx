import { useState } from "react";
import { toast } from "sonner";
import { mensajeDeError } from "@/api/cliente";
import { useReportarErrorIa } from "@/api/consultas";
import type { MotivoReporte } from "@/api/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { Dialogo } from "@/components/ui/Dialogo";
import { campoPorRuta } from "@/lib/contenido";

const MOTIVOS: Array<{ valor: MotivoReporte; etiqueta: string; ayuda: string }> = [
  { valor: "valor_incorrecto", etiqueta: "El valor es incorrecto", ayuda: "Se dijo algo distinto a lo que llenó la IA." },
  { valor: "inventado", etiqueta: "La IA lo inventó", ayuda: "Eso no se dijo en el audio." },
  { valor: "omitido", etiqueta: "Le faltó algo que se dijo", ayuda: "La IA dejó fuera información del audio." },
];

/**
 * "Reportar error de la IA" (RF-44, VC con Linear). Django lo pasa a n8n, que crea un issue en Linear
 * con solo la ruta del campo y el motivo: nunca texto clínico ni datos del paciente (RNF-05).
 */
export function DialogoReportarError({ campo, onCerrar }: { campo: string | null; onCerrar: () => void }) {
  const [motivo, setMotivo] = useState<MotivoReporte>("valor_incorrecto");
  const reportar = useReportarErrorIa();
  const ref = campo ? campoPorRuta(campo) : undefined;
  const renglon = campo?.match(/\[(\d+)\]$/);
  const nombre = ref ? `${ref.campo.etiqueta}${renglon ? ` · renglón ${Number(renglon[1]) + 1}` : ""}` : campo;

  const cerrar = () => {
    reportar.reset();
    setMotivo("valor_incorrecto");
    onCerrar();
  };

  const enviar = async () => {
    if (!campo) return;
    try {
      await reportar.mutateAsync({ campo, motivo });
      toast.success("Reporte enviado al equipo. No se envió ningún dato del paciente.");
      cerrar();
    } catch {
      // El error se muestra en el diálogo.
    }
  };

  return (
    <Dialogo
      abierto={campo !== null}
      onCerrar={cerrar}
      rol="dialog"
      titulo="¿Qué hizo mal la IA?"
      acciones={
        <>
          <button type="button" className="btn btn-secondary" onClick={cerrar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void enviar()} disabled={reportar.isPending}>
            {reportar.isPending ? "Enviando…" : "Enviar reporte"}
          </button>
        </>
      }
    >
      <div className="mt-2 grid gap-4">
        <p className="t-body text-texto-muted">
          Campo: <b className="text-texto">{nombre}</b>. El reporte crea una tarea para el equipo con solo el nombre del campo y el motivo; no se
          envía texto clínico ni datos del paciente. Corrige el valor en el formulario como siempre.
        </p>
        <fieldset className="grid gap-1">
          <legend className="field-label mb-1">Motivo</legend>
          {MOTIVOS.map((m) => (
            <label key={m.valor} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-surface-hover">
              <input
                type="radio"
                name="motivo-reporte"
                className="mt-1 h-5 w-5 accent-[var(--color-action)]"
                checked={motivo === m.valor}
                onChange={() => setMotivo(m.valor)}
              />
              <span className="grid">
                <span className="font-semibold">{m.etiqueta}</span>
                <span className="t-body-sm text-texto-muted">{m.ayuda}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {reportar.isError && (
          <Aviso variante="critical" titulo="No se pudo enviar el reporte">
            {mensajeDeError(reportar.error)}
          </Aviso>
        )}
      </div>
    </Dialogo>
  );
}
