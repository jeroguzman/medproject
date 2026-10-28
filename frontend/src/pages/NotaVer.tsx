import { FilePen, Printer } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { mensajeDeError } from "@/api/cliente";
import { useNota } from "@/api/consultas";
import { ProveedorEvidencia } from "@/components/consulta/ContextoEvidencia";
import { PanelTranscripcion } from "@/components/consulta/PanelDerecho";
import { InsigniaBorrador, InsigniaEstadoNota } from "@/components/nota/InsigniaEstadoNota";
import { NotaLectura } from "@/components/nota/NotaLectura";
import { PanelVersiones } from "@/components/nota/PanelVersiones";
import { CabeceraPaciente } from "@/components/paciente/CabeceraPaciente";
import { Aviso } from "@/components/ui/Aviso";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { useAlto } from "@/hooks/useAlto";
import { useTitulo } from "@/hooks/useTitulo";
import { existeCorreccion } from "@/lib/borrador";
import {
  edadEnAnios,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  nombreCabecera,
  textoModoCaptura,
  textoTipoConsulta,
} from "@/lib/formatos";
import { cn } from "@/lib/utils";

/** Nota autorizada en solo lectura, con sus versiones (RF-07, RF-36). */
export default function NotaVer() {
  const id = Number(useParams().id);
  const { data: nota, isLoading, isError, error } = useNota(id);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [pestana, setPestana] = useState<"versiones" | "transcripcion">("versiones");
  const [refCabecera, alto] = useAlto<HTMLDivElement>();
  useTitulo(nota ? `${nombreCabecera(nota.paciente)} · Nota ${formatearFecha(nota.fecha_consulta)}` : "Nota");

  if (isError) {
    return (
      <div className="p-6">
        <Aviso variante="critical" titulo="No se pudo abrir la nota">
          {mensajeDeError(error)} <Link to="/pacientes">Volver a pacientes</Link>
        </Aviso>
      </div>
    );
  }
  if (isLoading || !nota) {
    return (
      <div className="p-6">
        <div className="card">
          <Esqueleto etiqueta="Cargando la nota" lineas={8} />
        </div>
      </div>
    );
  }

  const numero = seleccion ?? nota.version_vigente;
  const version = nota.versiones.find((v) => v.numero === numero) ?? nota.versiones[0];
  const esVigente = version.numero === nota.version_vigente;
  const edad = edadEnAnios(nota.paciente.fecha_nacimiento, nota.fecha_consulta);
  const enCorreccion = existeCorreccion(nota.id);
  const elegirVersion = (n: number | null) => {
    setSeleccion(n === nota.version_vigente ? null : n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ProveedorEvidencia>
      <div style={{ "--alto-cabecera": `${48 + alto}px` } as CSSProperties}>
      <div ref={refCabecera} className="sticky top-12 z-30 shadow-1">
        <CabeceraPaciente paciente={nota.paciente} fechaReferencia={nota.fecha_consulta} flush />
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 px-4 py-5">
          <div className="mx-auto grid max-w-[960px] gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grid gap-1">
                <p className="t-body-sm">
                  <Link to={`/pacientes/${nota.paciente.id}`}>Expediente de {nombreCabecera(nota.paciente)}</Link>
                </p>
                <h1 className="t-title-lg flex flex-wrap items-center gap-3">
                  Nota del <span className="tnum">{formatearFecha(nota.fecha_consulta)}</span>
                  <InsigniaEstadoNota estado={nota.estado} version={nota.version_vigente} />
                  {enCorreccion && <InsigniaBorrador texto="Corrección sin autorizar" />}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/notas/${nota.id}/imprimir${esVigente ? "" : `?version=${version.numero}`}`} className="btn btn-secondary">
                  <Printer className="h-5 w-5" aria-hidden="true" />
                  Imprimir
                </Link>
                <Link to={`/notas/${nota.id}/corregir`} className="btn btn-primary">
                  <FilePen className="h-5 w-5" aria-hidden="true" />
                  {enCorreccion ? "Continuar corrección" : "Corregir"}
                </Link>
              </div>
            </div>

            <dl className="card grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Fecha y hora de atención", `${formatearFecha(nota.fecha_consulta)} · ${formatearHora(nota.hora_atencion)}`],
                ["Tipo de consulta", textoTipoConsulta(nota.tipo_consulta)],
                ["Modo de captura", `${textoModoCaptura(nota.modo_captura)}${nota.modo_captura === "consulta" ? (nota.consentimiento_grabacion ? " · con consentimiento" : " · sin consentimiento") : ""}`],
                ["Médico responsable", `${nota.medico.nombre_completo} · Céd. ${nota.medico.cedula_profesional}`],
                [esVigente ? "Versión vigente" : "Versión mostrada", `v${version.numero} de ${nota.versiones.length}`],
                ["Autorizada", `${formatearFechaHora(version.autorizada_en)} · ${version.autorizada_por}`],
              ].map(([dt, dd]) => (
                <div key={dt} className="grid gap-0.5">
                  <dt className="t-caption text-texto-muted">{dt}</dt>
                  <dd className="tnum m-0">{dd}</dd>
                </div>
              ))}
              {version.motivo_cambio && (
                <div className="grid gap-0.5 sm:col-span-2 lg:col-span-3">
                  <dt className="t-caption text-texto-muted">Motivo del cambio</dt>
                  <dd className="m-0">{version.motivo_cambio}</dd>
                </div>
              )}
            </dl>

            {!esVigente && (
              <Aviso
                variante="warning"
                titulo="Versión anterior · no vigente"
                acciones={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => elegirVersion(null)}>
                    Ver la versión vigente (v{nota.version_vigente})
                  </button>
                }
              >
                Esta versión se conserva sin cambios para consulta. La que vale es la versión {nota.version_vigente}.
              </Aviso>
            )}

            <NotaLectura contenido={version.contenido} esMenor={edad !== null && edad < 18} />
          </div>
        </div>

        <aside
          data-scroll-panel
          aria-label="Versiones y transcripción"
          className="border-t border-border bg-surface xl:sticky xl:top-[var(--alto-cabecera)] xl:h-[calc(100vh-var(--alto-cabecera))] xl:self-start xl:overflow-y-auto xl:border-l xl:border-t-0"
        >
          <div className="tabs px-2" role="tablist" aria-label="Panel de la nota">
            {(["versiones", "transcripcion"] as const).map((p) => (
              <button key={p} type="button" role="tab" aria-selected={pestana === p} onClick={() => setPestana(p)}>
                {p === "versiones" ? "Versiones" : "Transcripción"}
                {p === "versiones" && <span className="count">{nota.versiones.length}</span>}
              </button>
            ))}
          </div>
          <div role="tabpanel" className={cn(pestana === "transcripcion" && "min-h-[200px]")}>
            {pestana === "versiones" ? (
              <PanelVersiones versiones={nota.versiones} vigente={nota.version_vigente} seleccionada={numero} onSeleccionar={elegirVersion} />
            ) : (
              <PanelTranscripcion transcripcion={version.transcripcion} />
            )}
          </div>
        </aside>
      </div>
      </div>
    </ProveedorEvidencia>
  );
}
