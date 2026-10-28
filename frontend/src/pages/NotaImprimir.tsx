import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { mensajeDeError } from "@/api/cliente";
import { useNota } from "@/api/consultas";
import { NotaLectura } from "@/components/nota/NotaLectura";
import { Aviso } from "@/components/ui/Aviso";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Logo } from "@/components/ui/Logo";
import { useTitulo } from "@/hooks/useTitulo";
import {
  edadEnAnios,
  formatearEdad,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  nombreNatural,
  textoModoCaptura,
  textoSexo,
  textoTipoConsulta,
} from "@/lib/formatos";

/** Vista de impresión de la nota autorizada (VC-23): diseño parecido a la plantilla en papel, sin navegación. */
export default function NotaImprimir() {
  const id = Number(useParams().id);
  const [parametros] = useSearchParams();
  const { data: nota, isError, error } = useNota(id);
  useTitulo(nota ? `Nota ${formatearFecha(nota.fecha_consulta)} · ${nota.paciente.numero_expediente}` : "Imprimir nota");

  const pedida = Number(parametros.get("version")) || null;
  const version = nota ? (nota.versiones.find((v) => v.numero === (pedida ?? nota.version_vigente)) ?? nota.versiones[0]) : null;

  useEffect(() => {
    if (!nota) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [nota]);

  if (isError) {
    return (
      <div className="p-6">
        <Aviso variante="critical" titulo="No se pudo abrir la nota">
          {mensajeDeError(error)}
        </Aviso>
      </div>
    );
  }
  if (!nota || !version) return <Esqueleto etiqueta="Preparando la impresión" lineas={10} />;

  const p = nota.paciente;
  const edad = edadEnAnios(p.fecha_nacimiento, nota.fecha_consulta);
  const vigente = version.numero === nota.version_vigente;
  const identificacion: Array<[string, string, boolean?]> = [
    ["Paciente", nombreNatural(p)],
    ["Expediente", p.numero_expediente, true],
    ["Fecha de nacimiento", formatearFecha(p.fecha_nacimiento)],
    ["Edad / sexo", `${formatearEdad(p.fecha_nacimiento, nota.fecha_consulta)} · ${textoSexo(p.sexo)}`],
    ["Fecha y hora de atención", `${formatearFecha(nota.fecha_consulta)} · ${formatearHora(nota.hora_atencion)}`],
    ["Tipo de consulta", textoTipoConsulta(nota.tipo_consulta)],
    ["Médico responsable", nota.medico.nombre_completo],
    ["Cédula profesional", nota.medico.cedula_profesional, true],
    ["Alergias registradas", p.alergias],
    ["Modo de captura", `${textoModoCaptura(nota.modo_captura)}${nota.modo_captura === "consulta" && nota.consentimiento_grabacion ? " · el paciente autorizó la grabación" : ""}`],
  ];

  return (
    <div className="mx-auto max-w-[820px] bg-surface p-8 text-texto print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        <Link to={`/notas/${id}`} className="btn btn-secondary">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Volver a la nota
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Printer className="h-5 w-5" aria-hidden="true" />
          Imprimir o guardar como PDF
        </button>
      </div>

      <header className="mb-4 flex items-end justify-between border-b-2 border-texto pb-2">
        <div>
          <Logo className="mb-3 flex h-8" />
          <p className="t-caption uppercase tracking-wide text-texto-muted">Nota de consulta</p>
          <h1 className="t-title-lg">Formato Clínico General</h1>
        </div>
        <p className="t-body-sm text-right text-texto-muted">
          Versión de plantilla {nota.plantilla.version}
          <br />
          Nota {nota.id} · v{version.numero}
        </p>
      </header>

      {!vigente && (
        <p className="t-label mb-4 rounded-md border-2 border-dashed border-advertencia-solid p-2 text-center text-advertencia-fg">
          Versión anterior · no vigente (la vigente es la versión {nota.version_vigente})
        </p>
      )}

      <section className="mb-4 break-inside-avoid" aria-labelledby="imp-01">
        <h2 id="imp-01" className="t-label mb-2 flex items-baseline gap-3 border-b border-texto pb-1 text-base uppercase">
          <span className="mono text-texto-subtle">01</span>Identificación de paciente y atención
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
          {identificacion.map(([dt, dd, mono]) => (
            <div key={dt} className="grid grid-cols-[11rem_1fr] gap-x-2">
              <dt className="t-body-sm font-semibold">{dt}</dt>
              <dd className={`t-body-sm m-0 tnum ${mono ? "mono" : ""}`}>{dd}</dd>
            </div>
          ))}
        </dl>
      </section>

      <NotaLectura contenido={version.contenido} esMenor={edad !== null && edad < 18} impresion />

      <section className="mt-4 break-inside-avoid" aria-labelledby="imp-09">
        <h2 id="imp-09" className="t-label mb-2 flex items-baseline gap-3 border-b border-texto pb-1 text-base uppercase">
          <span className="mono text-texto-subtle">09</span>Revisión y autorización
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
          {[
            ["Estado", nota.estado === "corregida" ? `Corregida · v${nota.version_vigente}` : "Autorizada"],
            ["Versión impresa", `v${version.numero}${vigente ? " (vigente)" : " (anterior)"}`],
            ["Autorizada el", formatearFechaHora(version.autorizada_en)],
            ["Autorizada por", version.autorizada_por],
            ...(version.motivo_cambio ? [["Motivo del cambio", version.motivo_cambio]] : []),
          ].map(([dt, dd]) => (
            <div key={dt} className="grid grid-cols-[11rem_1fr] gap-x-2">
              <dt className="t-body-sm font-semibold">{dt}</dt>
              <dd className="t-body-sm m-0 tnum">{dd}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 grid w-72 justify-items-center gap-1 border-t border-texto pt-1">
          <span className="t-body-sm">{version.autorizada_por}</span>
          <span className="t-caption text-texto-muted">Nombre del médico (equivale a la firma) · Céd. {nota.medico.cedula_profesional}</span>
        </div>
      </section>

      <footer className="t-caption mt-8 border-t border-border pt-2 text-texto-muted">
        Datos ficticios · Documento generado por MedVox el {formatearFechaHora(new Date().toISOString())}. La autorización electrónica de esta nota
        no sustituye una firma electrónica avanzada.
      </footer>
    </div>
  );
}
