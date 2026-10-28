import { BookOpen, ExternalLink, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { mensajeDeError } from "@/api/cliente";
import { useReferencias } from "@/api/consultas";
import { Aviso } from "@/components/ui/Aviso";
import { Esqueleto } from "@/components/ui/Esqueleto";

const dominio = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * Referencias de apoyo (RF-39, Tavily vía Django). Solo viaja el término clínico, nunca datos del paciente,
 * y los resultados nunca llenan campos.
 */
export function PanelReferencias({ terminoInicial }: { terminoInicial: string }) {
  const [texto, setTexto] = useState(terminoInicial);
  const [termino, setTermino] = useState(terminoInicial);
  const referencias = useReferencias(termino);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    setTermino(texto.trim());
  };

  return (
    <div className="grid gap-3 p-4">
      <form className="flex gap-2" onSubmit={buscar} role="search">
        <label htmlFor="termino-referencia" className="sr-only">
          Diagnóstico o medicamento
        </label>
        <input
          id="termino-referencia"
          className="input min-w-0 flex-1"
          placeholder="Diagnóstico o medicamento"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary btn-icon" aria-label="Buscar referencias">
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
      <p className="help">Solo se envía el término, nunca datos del paciente. Fuentes: MedlinePlus, OMS, OPS, gob.mx, IMSS y CENETEC.</p>

      {termino.length < 3 ? (
        <div className="empty">
          <BookOpen className="h-6 w-6 text-texto-subtle" aria-hidden="true" />
          <b>Información de apoyo</b>
          <p className="t-body-sm">Pulsa «Referencias» en un diagnóstico o medicamento, o escribe un término de al menos 3 letras.</p>
        </div>
      ) : referencias.isLoading ? (
        <Esqueleto etiqueta="Buscando referencias" lineas={5} />
      ) : referencias.isError ? (
        <Aviso variante="critical" titulo="No se pudieron cargar las referencias">
          {mensajeDeError(referencias.error)}
        </Aviso>
      ) : referencias.data && referencias.data.resultados.length > 0 ? (
        <ul className="grid gap-2" aria-label={`Referencias sobre ${termino}`}>
          {referencias.data.resultados.map((r) => (
            <li key={r.url} className="grid gap-1 rounded-md border border-border p-3">
              <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 font-semibold">
                <span>{r.titulo}</span>
                <ExternalLink className="mt-1 h-4 w-4 flex-none" aria-label="Se abre en otra pestaña" />
              </a>
              <span className="t-caption text-texto-subtle">{dominio(r.url)}</span>
              <p className="t-body-sm text-texto-muted">{r.fragmento}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-body-sm text-texto-muted">No encontramos referencias de fuentes confiables para «{termino}».</p>
      )}

      <p className="t-caption text-texto-subtle">Información de apoyo: no sustituye el criterio médico.</p>
    </div>
  );
}
