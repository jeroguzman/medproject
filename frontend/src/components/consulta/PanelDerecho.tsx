import { ExternalLink, FileText, MessageSquareText } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { NotaResumen } from "@/api/tipos";
import { useEvidencia } from "@/components/consulta/ContextoEvidencia";
import { PanelReferencias } from "@/components/consulta/PanelReferencias";
import { InsigniaEstadoNota } from "@/components/nota/InsigniaEstadoNota";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { rangosDeCitas } from "@/lib/evidencia";
import { formatearDuracion, formatearFecha } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import type { Segmento, Transcripcion } from "@/plantilla/valores";

const ROLES: Record<string, string> = { medico: "Médico", paciente: "Paciente", acompanante: "Acompañante", desconocido: "Sin identificar" };

function TextoResaltado({ texto, citas }: { texto: string; citas: string[] }) {
  const rangos = citas.length ? rangosDeCitas(texto, citas) : [];
  if (rangos.length === 0) return <>{texto}</>;
  const partes: JSX.Element[] = [];
  let cursor = 0;
  rangos.forEach(([a, b], i) => {
    if (a > cursor) partes.push(<Fragment key={`t${i}`}>{texto.slice(cursor, a)}</Fragment>);
    partes.push(
      <mark key={`m${i}`} className="evidencia">
        {texto.slice(a, b)}
      </mark>,
    );
    cursor = b;
  });
  if (cursor < texto.length) partes.push(<Fragment key="fin">{texto.slice(cursor)}</Fragment>);
  return <>{partes}</>;
}

/** Transcripción separada por hablante en modo Consulta, con la evidencia resaltada (RF-27). */
export function PanelTranscripcion({ transcripcion }: { transcripcion: Transcripcion | null }) {
  const { citasActivas, solicitud } = useEvidencia();
  const contenedor = useRef<HTMLDivElement>(null);
  const segmentos = transcripcion?.segmentos ?? [];
  const conRoles = segmentos.some((s) => s.rol && s.rol !== "medico");
  const variosAudios = new Set(segmentos.map((s) => s.audio ?? 1)).size > 1;

  // Desplaza el panel (no la página) hasta la primera cita.
  useEffect(() => {
    const marca = contenedor.current?.querySelector<HTMLElement>("mark.evidencia");
    const caja = contenedor.current?.closest<HTMLElement>("[data-scroll-panel]");
    if (!marca || !caja) return;
    const delta = marca.getBoundingClientRect().top - caja.getBoundingClientRect().top - caja.clientHeight / 3;
    caja.scrollBy({ top: delta, behavior: "smooth" });
  }, [citasActivas, solicitud.n]);

  if (segmentos.length === 0 && !transcripcion?.texto) {
    return (
      <div className="empty m-4">
        <MessageSquareText className="h-6 w-6 text-texto-subtle" aria-hidden="true" />
        <b>Aún no hay transcripción</b>
        <p className="t-body-sm">Graba o sube un audio y pulsa «Procesar audio». Aquí verás lo que se dijo, separado por hablante.</p>
      </div>
    );
  }

  if (segmentos.length === 0) {
    return (
      <div ref={contenedor} className="t-body whitespace-pre-wrap p-4">
        <TextoResaltado texto={transcripcion!.texto} citas={citasActivas} />
      </div>
    );
  }

  let audioAnterior = 0;
  return (
    <div ref={contenedor} className="grid gap-3 p-4">
      {segmentos.map((s: Segmento, i) => {
        const audio = s.audio ?? 1;
        const separador = variosAudios && audio !== audioAnterior;
        audioAnterior = audio;
        return (
          <Fragment key={i}>
            {separador && <p className="t-caption mt-2 uppercase tracking-wide text-texto-subtle">Audio {audio}</p>}
            <div className="grid gap-0.5">
              <div className="flex items-baseline gap-2">
                {conRoles && (
                  <span className={cn("t-label", s.rol === "paciente" ? "text-info-fg" : s.rol === "medico" ? "text-accion-texto" : "text-texto-muted")}>
                    {ROLES[s.rol ?? "desconocido"] ?? s.hablante}
                  </span>
                )}
                {typeof s.inicio === "number" && <span className="t-caption tnum text-texto-subtle">{formatearDuracion(s.inicio)}</span>}
              </div>
              <p className="t-body">
                <TextoResaltado texto={s.texto} citas={citasActivas} />
              </p>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function PanelHistorial({ notas, cargando }: { notas: NotaResumen[] | undefined; cargando: boolean }) {
  if (cargando) return <Esqueleto etiqueta="Cargando historial" lineas={5} />;
  if (!notas || notas.length === 0) {
    return (
      <div className="empty m-4">
        <FileText className="h-6 w-6 text-texto-subtle" aria-hidden="true" />
        <b>Sin notas anteriores</b>
        <p className="t-body-sm">Esta es la primera consulta registrada del paciente.</p>
      </div>
    );
  }
  return (
    <ol className="grid gap-2 p-4">
      {notas.map((n) => (
        <li key={n.id}>
          <a
            href={`/notas/${n.id}`}
            target="_blank"
            rel="noreferrer"
            className="grid gap-1 rounded-md border border-border p-3 text-texto no-underline hover:bg-surface-hover"
          >
            <span className="flex items-center gap-2">
              <span className="t-caption tnum text-texto-muted">{formatearFecha(n.fecha_consulta)}</span>
              <InsigniaEstadoNota estado={n.estado} version={n.version_vigente} />
              <ExternalLink className="ml-auto h-4 w-4 text-texto-subtle" aria-label="Se abre en otra pestaña" />
            </span>
            <span className="font-semibold">{n.diagnostico_principal ?? "— Sin diagnóstico"}</span>
            <span className="t-body-sm text-texto-muted">{n.medico}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

interface Props {
  transcripcion: Transcripcion | null;
  notas: NotaResumen[] | undefined;
  cargandoNotas: boolean;
  /** Excluye una nota del historial (la que se está corrigiendo). */
  excluirNota?: number;
}

type Pestana = "transcripcion" | "historial" | "referencias";

/**
 * Panel derecho de 360 px (prompt 5, DS 10.3): "Transcripción", "Historial" y "Referencias" (Tavily).
 */
export function PanelDerecho({ transcripcion, notas, cargandoNotas, excluirNota }: Props) {
  const [pestana, setPestana] = useState<Pestana>("transcripcion");
  const { solicitud, referencia } = useEvidencia();
  const base = useId();
  const lista = notas?.filter((n) => n.id !== excluirNota);

  useEffect(() => {
    if (solicitud.n > 0) setPestana("transcripcion");
  }, [solicitud.n]);
  useEffect(() => {
    if (referencia.n > 0) setPestana("referencias");
  }, [referencia.n]);

  const pestanas: Array<{ id: Pestana; etiqueta: string }> = [
    { id: "transcripcion", etiqueta: "Transcripción" },
    { id: "historial", etiqueta: "Historial" },
    { id: "referencias", etiqueta: "Referencias" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="tabs shrink-0 px-1 [&_button]:px-2.5" role="tablist" aria-label="Panel de apoyo">
        {pestanas.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`${base}-${p.id}`}
            aria-selected={pestana === p.id}
            aria-controls={`${base}-${p.id}-panel`}
            tabIndex={pestana === p.id ? 0 : -1}
            onClick={() => setPestana(p.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const paso = e.key === "ArrowRight" ? 1 : -1;
                const siguiente = pestanas[(i + paso + pestanas.length) % pestanas.length].id;
                setPestana(siguiente);
                document.getElementById(`${base}-${siguiente}`)?.focus();
              }
            }}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      <div
        data-scroll-panel
        role="tabpanel"
        id={`${base}-${pestana}-panel`}
        aria-labelledby={`${base}-${pestana}`}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {pestana === "transcripcion" ? (
          <PanelTranscripcion transcripcion={transcripcion} />
        ) : pestana === "historial" ? (
          <PanelHistorial notas={lista} cargando={cargandoNotas} />
        ) : (
          <PanelReferencias key={referencia.n} terminoInicial={referencia.termino} />
        )}
      </div>
    </div>
  );
}
