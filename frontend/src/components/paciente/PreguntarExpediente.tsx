import { Loader2, MessagesSquare, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { mensajeDeError } from "@/api/cliente";
import { usePreguntarExpediente } from "@/api/consultas";
import type { Paciente } from "@/api/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { formatearFecha, nombreNatural } from "@/lib/formatos";

const SUGERENCIAS = ["¿Qué alergias tiene?", "¿Qué diagnósticos ha tenido?", "¿Qué medicamentos se le han indicado?"];

/**
 * Pregúntale al expediente (RF-38, Backboard vía Django). Responde solo con las notas autorizadas del paciente
 * (última versión de cada una) y cita la nota de origen. Nunca usa borradores.
 */
export function PreguntarExpediente({ paciente }: { paciente: Paciente }) {
  const [pregunta, setPregunta] = useState("");
  const preguntar = usePreguntarExpediente(paciente.id);
  const sinNotas = paciente.total_notas === 0;

  const enviar = (texto: string) => {
    const limpio = texto.trim();
    if (limpio.length < 3 || preguntar.isPending) return;
    setPregunta(limpio);
    preguntar.mutate(limpio);
  };

  return (
    <section aria-labelledby="titulo-preguntar" className="card grid gap-3 self-start p-5">
      <h2 id="titulo-preguntar" className="t-title-sm flex items-center gap-2">
        <MessagesSquare className="h-5 w-5 text-accion-texto" aria-hidden="true" />
        Pregúntale al expediente
      </h2>
      <p className="help">
        Responde solo con las notas autorizadas de {nombreNatural(paciente)} y te dice de qué nota sale cada dato.
      </p>

      {sinNotas ? (
        <p className="t-body-sm rounded-md border border-dashed border-input bg-canvas p-3 text-texto-muted">
          Aún no hay notas autorizadas que consultar.
        </p>
      ) : (
        <>
          <form
            className="grid gap-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              enviar(pregunta);
            }}
          >
            <label htmlFor="pregunta-expediente" className="sr-only">
              Pregunta sobre el expediente
            </label>
            <textarea
              id="pregunta-expediente"
              className="textarea"
              rows={2}
              maxLength={300}
              placeholder="Por ejemplo: ¿qué alergias tiene?"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(pregunta);
                }
              }}
            />
            <button type="submit" className="btn btn-secondary justify-self-start" disabled={preguntar.isPending || pregunta.trim().length < 3}>
              {preguntar.isPending ? <Loader2 className="spin h-5 w-5" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
              {preguntar.isPending ? "Buscando en las notas…" : "Preguntar"}
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5" aria-label="Preguntas sugeridas">
            {SUGERENCIAS.map((s) => (
              <button key={s} type="button" className="badge b-neutral cursor-pointer hover:bg-surface-hover" onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      <div aria-live="polite">
        {preguntar.isError && (
          <Aviso variante="critical" titulo="No se pudo consultar el expediente">
            {mensajeDeError(preguntar.error)}
          </Aviso>
        )}
        {preguntar.data && !preguntar.isPending && (
          <div className="grid gap-2 rounded-md border border-border bg-canvas p-3">
            <p className="t-body">{preguntar.data.respuesta}</p>
            {preguntar.data.fuentes.length > 0 && (
              <div className="grid gap-1">
                <span className="t-caption text-texto-muted">Fuentes</span>
                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                  {preguntar.data.fuentes.map((f) => (
                    <li key={`${f.nota_id}-${f.version}`}>
                      <Link to={`/notas/${f.nota_id}`} className="t-body-sm tnum">
                        Nota del {formatearFecha(f.fecha_consulta)} · v{f.version}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="t-caption text-texto-subtle">Información de apoyo: verifica en la nota antes de decidir.</p>
    </section>
  );
}
