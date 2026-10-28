import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ErrorApi, mensajeDeError } from "@/api/cliente";
import { useAutorizarCorreccion, useNota, useNotasPaciente } from "@/api/consultas";
import { BarraTrabajo } from "@/components/consulta/BarraTrabajo";
import { ProveedorEvidencia } from "@/components/consulta/ContextoEvidencia";
import { EditorFormato } from "@/components/consulta/EditorFormato";
import { IndiceSecciones } from "@/components/consulta/IndiceSecciones";
import { MarcoTrabajo } from "@/components/consulta/MarcoTrabajo";
import { PanelDerecho } from "@/components/consulta/PanelDerecho";
import { bloqueosDeAlertas, SeccionRevision } from "@/components/consulta/SeccionRevision";
import { InsigniaEstadoNota } from "@/components/nota/InsigniaEstadoNota";
import { CabeceraPaciente } from "@/components/paciente/CabeceraPaciente";
import { Aviso } from "@/components/ui/Aviso";
import { Dialogo } from "@/components/ui/Dialogo";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { useAvisoAlSalir } from "@/hooks/useAvisoAlSalir";
import { useDocumentoLocal } from "@/hooks/useDocumentoLocal";
import { useTitulo } from "@/hooks/useTitulo";
import { alertasAbiertas, alertasQueBloquean, calcularAlertas } from "@/lib/alertas";
import { claveCorreccion, crearCorreccion, leerCorreccion, type Correccion } from "@/lib/borrador";
import { calcularFaltantes, prepararContenido, resumirContenido, type CampoRef } from "@/lib/contenido";
import { edadEnAnios, formatearFecha, formatearHora, nombreCabecera } from "@/lib/formatos";
import type { ValorCampo } from "@/plantilla/valores";

/**
 * Corrección de una nota autorizada (prompt 9, RF-34 y RF-35): copia de trabajo en localStorage. La versión
 * vigente no cambia hasta que se autoriza la corrección, que crea una versión nueva.
 */
export default function NotaCorregir() {
  const notaId = Number(useParams().id);
  const navegar = useNavigate();
  const { data: nota, isError, error } = useNota(notaId);
  const notas = useNotasPaciente(nota?.paciente.id ?? 0);
  const autorizar = useAutorizarCorreccion(notaId);
  const [dialogo, setDialogo] = useState<"autorizar" | "descartar" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoTocado, setMotivoTocado] = useState(false);
  const [conflicto, setConflicto] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const vigente = nota?.versiones.find((v) => v.numero === nota.version_vigente) ?? nota?.versiones[0];
  const { doc, actualizar, descartar, cerrar, estado, guardadoEn, existeEnEquipo } = useDocumentoLocal<Correccion>({
    clave: claveCorreccion(notaId),
    listo: !!nota && !!vigente,
    leer: () => leerCorreccion(notaId),
    crear: () => crearCorreccion(notaId, nota!.version_vigente, vigente!.contenido),
  });
  useAvisoAlSalir(existeEnEquipo);
  useTitulo(nota ? `${nombreCabecera(nota.paciente)} · Corrección` : "Corrección");

  const edad = nota ? edadEnAnios(nota.paciente.fecha_nacimiento, nota.fecha_consulta) : null;
  const esMenor = edad !== null && edad < 18;
  const alertas = useMemo(
    () =>
      doc
        ? calcularAlertas({ contenido: doc.secciones, alertasIa: [], resueltas: doc.alertas_resueltas, alergiasPaciente: nota?.paciente.alergias ?? null, esMenor })
        : [],
    [doc, nota?.paciente.alergias, esMenor],
  );

  const cambiarCampo = useCallback(
    (ref: CampoRef, valor: ValorCampo) =>
      actualizar((d) => ({ ...d, secciones: { ...d.secciones, [ref.grupo]: { ...d.secciones[ref.grupo], [ref.campo.clave]: valor } } })),
    [actualizar],
  );
  const resolverAlerta = useCallback(
    (id: string, justificacion?: string) =>
      actualizar((d) => ({ ...d, alertas_resueltas: [...d.alertas_resueltas, justificacion ? `${id}::${justificacion}` : id] })),
    [actualizar],
  );

  if (isError) {
    return (
      <div className="p-6">
        <Aviso variante="critical" titulo="No se pudo abrir la nota">
          {mensajeDeError(error)} <Link to="/pacientes">Volver a pacientes</Link>
        </Aviso>
      </div>
    );
  }
  if (!nota || !vigente || !doc) {
    return (
      <div className="p-6">
        <div className="card">
          <Esqueleto etiqueta="Cargando la nota" lineas={8} />
        </div>
      </div>
    );
  }

  const desactualizada = doc.version_base !== nota.version_vigente;
  const contenidoListo = prepararContenido(doc.secciones);
  const sinCambios = JSON.stringify(contenidoListo) === JSON.stringify(prepararContenido(vigente.contenido));
  const faltantes = calcularFaltantes({ contenido: doc.secciones });
  if (sinCambios) faltantes.unshift({ ruta: "motivo_padecimiento.motivo_consulta", etiqueta: "Haz al menos un cambio en la nota" });
  const bloqueos = bloqueosDeAlertas(alertasQueBloquean(alertas));

  const descartarYRecargar = () => {
    cerrar();
    navegar(`/notas/${notaId}`, { replace: true });
  };

  const confirmar = async () => {
    setMotivoTocado(true);
    if (!motivo.trim()) {
      document.getElementById("motivo-cambio")?.focus();
      return;
    }
    setErrorServidor(null);
    try {
      const actualizada = await autorizar.mutateAsync({ contenido: contenidoListo, motivo_cambio: motivo.trim(), version_base: doc.version_base });
      cerrar();
      setDialogo(null);
      toast.success(`Corrección autorizada · versión ${actualizada.version_vigente}`);
      navegar(`/notas/${notaId}`, { replace: true });
    } catch (e) {
      setDialogo(null);
      if (e instanceof ErrorApi && e.status === 409) setConflicto(true);
      else setErrorServidor(mensajeDeError(e));
    }
  };

  return (
    <ProveedorEvidencia>
      <MarcoTrabajo
        cabecera={
          <>
            <CabeceraPaciente paciente={nota.paciente} fechaReferencia={nota.fecha_consulta} flush />
            <BarraTrabajo
              insignia="Corrección sin autorizar"
              estado={estado}
              guardadoEn={guardadoEn}
              textoDescartar="Descartar corrección"
              onDescartar={() => setDialogo("descartar")}
            >
              <div className="grid gap-1">
                <span className="t-caption text-texto-muted">Corrigiendo la nota</span>
                <span className="flex flex-wrap items-center gap-2">
                  <Link to={`/notas/${notaId}`} className="t-label tnum">
                    {formatearFecha(nota.fecha_consulta)} · {formatearHora(nota.hora_atencion)}
                  </Link>
                  <InsigniaEstadoNota estado={nota.estado} version={nota.version_vigente} />
                  <span className="t-body-sm text-texto-muted">Parte de la versión {doc.version_base}</span>
                </span>
              </div>
            </BarraTrabajo>
          </>
        }
        indice={<IndiceSecciones contenido={doc.secciones} alertas={alertas} faltantes={faltantes.length + bloqueos.length} />}
        panel={<PanelDerecho transcripcion={vigente.transcripcion} notas={notas.data} cargandoNotas={notas.isLoading} excluirNota={notaId} />}
      >
        {(desactualizada || conflicto) && (
          <Aviso
            variante="critical"
            titulo="La nota cambió mientras la corregías"
            acciones={
              <button type="button" className="btn btn-secondary btn-sm" onClick={descartarYRecargar}>
                Descartar mi corrección y ver la vigente
              </button>
            }
          >
            Recarga para ver la versión vigente (v{nota.version_vigente}). Tu corrección partió de la versión {doc.version_base} y no se puede autorizar
            sobre ella.
          </Aviso>
        )}
        <Aviso variante="info" titulo="La versión vigente no cambia hasta que autorices la corrección">
          Cada corrección autorizada queda registrada como una versión nueva, con tu nombre, la fecha y el motivo. La identificación y los datos de
          la atención no se corrigen aquí.
        </Aviso>
        <EditorFormato
          contenido={doc.secciones}
          onCambioCampo={cambiarCampo}
          alertas={alertas}
          esMenor={esMenor}
          onResolverAlerta={resolverAlerta}
          revision={
            <SeccionRevision
              resumen={resumirContenido(doc.secciones)}
              alertasAbiertas={alertasAbiertas(alertas).length}
              faltantes={faltantes}
              bloqueos={bloqueos}
              textoBoton="Autorizar corrección"
              enviando={autorizar.isPending}
              onAutorizar={() => {
                if (desactualizada) return setConflicto(true);
                setMotivoTocado(false);
                setDialogo("autorizar");
              }}
              explicacion={`Se creará la versión ${nota.version_vigente + 1}. La versión ${nota.version_vigente} se conserva sin cambios.`}
              errorServidor={
                errorServidor && (
                  <Aviso variante="critical" titulo="La API no aceptó la corrección">
                    {errorServidor}
                  </Aviso>
                )
              }
            />
          }
        />
      </MarcoTrabajo>

      <Dialogo
        abierto={dialogo === "autorizar"}
        onCerrar={() => !autorizar.isPending && setDialogo(null)}
        titulo="¿Autorizar la corrección?"
        acciones={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDialogo(null)} disabled={autorizar.isPending}>
              Seguir editando
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void confirmar()} disabled={autorizar.isPending}>
              {autorizar.isPending ? "Autorizando…" : "Autorizar corrección"}
            </button>
          </>
        }
      >
        <p>
          Se creará la versión {nota.version_vigente + 1} de la nota de <b className="text-texto">{nombreCabecera(nota.paciente)}</b>. La versión{" "}
          {nota.version_vigente} se conserva sin cambios y se puede consultar.
        </p>
        <div className={`field mt-4 ${motivoTocado && !motivo.trim() ? "is-error" : ""}`}>
          <label htmlFor="motivo-cambio" className="field-label text-texto">
            Motivo del cambio<span className="req">*</span>
          </label>
          <textarea
            id="motivo-cambio"
            className="textarea"
            rows={3}
            maxLength={500}
            placeholder="Por ejemplo: Se corrige la dosis de paracetamol"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            aria-invalid={(motivoTocado && !motivo.trim()) || undefined}
          />
          {motivoTocado && !motivo.trim() && <p className="msg msg-error">Escribe el motivo: queda registrado con la versión nueva.</p>}
        </div>
      </Dialogo>

      <Dialogo
        abierto={dialogo === "descartar"}
        onCerrar={() => setDialogo(null)}
        titulo="¿Descartar la corrección?"
        acciones={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDialogo(null)}>
              Seguir editando
            </button>
            <button
              type="button"
              className="btn btn-critical"
              onClick={() => {
                descartar();
                cerrar();
                setDialogo(null);
                toast("Corrección descartada. La nota se queda como estaba.");
                navegar(`/notas/${notaId}`);
              }}
            >
              Descartar corrección
            </button>
          </>
        }
      >
        Se borran los cambios de esta corrección. La nota autorizada se queda como estaba.
      </Dialogo>
    </ProveedorEvidencia>
  );
}
