import { ChevronRight, FilePlus2, FileText, Mic } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { mensajeDeError } from "@/api/cliente";
import { useNotasPaciente, usePaciente } from "@/api/consultas";
import { InsigniaEstadoNota } from "@/components/nota/InsigniaEstadoNota";
import { CabeceraPaciente } from "@/components/paciente/CabeceraPaciente";
import { PreguntarExpediente } from "@/components/paciente/PreguntarExpediente";
import { Aviso } from "@/components/ui/Aviso";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Vacio } from "@/components/ui/Vacio";
import { useTitulo } from "@/hooks/useTitulo";
import { existeBorrador } from "@/lib/borrador";
import { formatearFecha, formatearHora, nombreCabecera, textoTipoConsulta } from "@/lib/formatos";

/** Expediente: cabecera e historial cronológico de notas autorizadas (RF-06). */
export default function Expediente() {
  const id = Number(useParams().id);
  const paciente = usePaciente(id);
  const notas = useNotasPaciente(id);
  useTitulo(paciente.data ? `${nombreCabecera(paciente.data)} · Expediente` : "Expediente");
  const hayBorrador = existeBorrador(id);

  if (paciente.isError) {
    return (
      <div className="p-6">
        <Aviso variante="critical" titulo="No se pudo abrir el expediente">
          {mensajeDeError(paciente.error)} <Link to="/pacientes">Volver a pacientes</Link>
        </Aviso>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6">
      {paciente.data ? <CabeceraPaciente paciente={paciente.data} /> : <div className="card"><Esqueleto etiqueta="Cargando paciente" lineas={2} /></div>}

      {hayBorrador && (
        <Aviso
          variante="info"
          titulo="Tienes una consulta sin autorizar"
          acciones={
            <Link to={`/pacientes/${id}/consulta`} className="btn btn-secondary btn-sm">
              Continuar consulta
            </Link>
          }
        >
          El borrador está guardado solo en este equipo y todavía no está en el expediente.
        </Aviso>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="t-title-md">Historial de notas</h1>
            <Link to={`/pacientes/${id}/consulta`} className="btn btn-primary">
              {hayBorrador ? <Mic className="h-5 w-5" aria-hidden="true" /> : <FilePlus2 className="h-5 w-5" aria-hidden="true" />}
              {hayBorrador ? "Continuar consulta" : "Nueva consulta"}
            </Link>
          </div>

          {notas.isError ? (
            <Aviso variante="critical" titulo="No se pudo cargar el historial">
              {mensajeDeError(notas.error)}
            </Aviso>
          ) : notas.isLoading ? (
            <div className="card">
              <Esqueleto etiqueta="Cargando historial" lineas={6} />
            </div>
          ) : notas.data && notas.data.length > 0 ? (
            <ol className="tl card p-4" aria-label="Notas autorizadas, de la más reciente a la más antigua">
              {notas.data.map((n) => (
                <li key={n.id}>
                  <Link
                    to={`/notas/${n.id}`}
                    className="group -my-1 flex items-center gap-4 rounded-md px-3 py-2 text-texto no-underline hover:bg-surface-hover"
                  >
                    <div className="grid min-w-0 flex-1 gap-0.5">
                      <span className="t-caption tnum text-texto-muted">
                        {formatearFecha(n.fecha_consulta)} · {formatearHora(n.hora_atencion)} · {textoTipoConsulta(n.tipo_consulta)}
                      </span>
                      <span className="font-semibold">{n.diagnostico_principal ?? "— Sin diagnóstico"}</span>
                      <span className="t-body-sm text-texto-muted">{n.medico}</span>
                    </div>
                    <InsigniaEstadoNota estado={n.estado} version={n.version_vigente} />
                    <ChevronRight className="h-5 w-5 text-texto-subtle group-hover:text-texto" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <Vacio icono={FileText} titulo="Aún no hay notas autorizadas">
              Inicia una consulta: cuando autorices la nota aparecerá aquí.
            </Vacio>
          )}
        </div>
        {paciente.data && <PreguntarExpediente paciente={paciente.data} />}
      </div>
    </div>
  );
}
