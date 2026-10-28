import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ErrorApi, mensajeDeError } from "@/api/cliente";
import { useAutorizarNota, useNotasPaciente, usePaciente } from "@/api/consultas";
import type { RespuestaProcesar } from "@/api/tipos";
import { AlertasConsulta } from "@/components/consulta/AlertasConsulta";
import { BarraTrabajo } from "@/components/consulta/BarraTrabajo";
import { ProveedorEvidencia } from "@/components/consulta/ContextoEvidencia";
import { EditorFormato } from "@/components/consulta/EditorFormato";
import { Grabadora } from "@/components/consulta/Grabadora";
import { IndiceSecciones } from "@/components/consulta/IndiceSecciones";
import { MarcoTrabajo } from "@/components/consulta/MarcoTrabajo";
import { PanelDerecho } from "@/components/consulta/PanelDerecho";
import { bloqueosDeAlertas, SeccionRevision } from "@/components/consulta/SeccionRevision";
import { CabeceraPaciente } from "@/components/paciente/CabeceraPaciente";
import { Aviso } from "@/components/ui/Aviso";
import { CampoFecha } from "@/components/ui/CampoFecha";
import { CampoHora } from "@/components/ui/CampoHora";
import { Dialogo } from "@/components/ui/Dialogo";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Segmentado } from "@/components/ui/Segmentado";
import { useAvisoAlSalir } from "@/hooks/useAvisoAlSalir";
import { useDocumentoLocal } from "@/hooks/useDocumentoLocal";
import { useTitulo } from "@/hooks/useTitulo";
import { alertasAbiertas, alertasQueBloquean, calcularAlertas } from "@/lib/alertas";
import { claveBorrador, crearBorrador, leerBorrador, PLANTILLA, type Borrador } from "@/lib/borrador";
import { calcularFaltantes, campoPorRuta, prepararContenido, resumirContenido, type CampoRef } from "@/lib/contenido";
import { ahoraEnMexico, edadEnAnios, formatearFechaHora, nombreCabecera } from "@/lib/formatos";
import { fusionarRespuesta, type DatosAudio } from "@/lib/fusion";
import { irACampo } from "@/lib/navegacion";
import type { TipoConsulta, ValorCampo } from "@/plantilla/valores";

const ETIQUETAS_IDENTIFICACION: Record<string, string> = {
  fecha_consulta: "Fecha de la consulta",
  hora_atencion: "Hora de atención",
  tipo_consulta: "Tipo de consulta",
  consentimiento_grabacion: "Consentimiento de grabación",
};

/** Pantalla de consulta: grabadora, formulario y panel derecho (prompts 5 a 8). */
export default function Consulta() {
  const pacienteId = Number(useParams().id);
  const navegar = useNavigate();
  const paciente = usePaciente(pacienteId);
  const notas = useNotasPaciente(pacienteId);
  const autorizar = useAutorizarNota();
  const [dialogo, setDialogo] = useState<"autorizar" | "descartar" | "cambiar_paciente" | null>(null);
  const [errorServidor, setErrorServidor] = useState<{ mensaje: string; faltantes: string[] } | null>(null);

  const listo = !!paciente.data && (notas.isSuccess || notas.isError);
  const { doc, actualizar, descartar, cerrar, estado, guardadoEn, existeEnEquipo } = useDocumentoLocal<Borrador>({
    clave: claveBorrador(pacienteId),
    listo,
    leer: () => leerBorrador(pacienteId),
    crear: () => crearBorrador(pacienteId, (notas.data?.length ?? paciente.data?.total_notas ?? 0) > 0),
  });
  useAvisoAlSalir(existeEnEquipo);
  useTitulo(paciente.data ? `${nombreCabecera(paciente.data)} · Consulta` : "Consulta");

  const esMenor = useMemo(() => {
    if (!paciente.data) return false;
    const edad = edadEnAnios(paciente.data.fecha_nacimiento, doc?.identificacion.fecha_consulta);
    return edad !== null && edad < 18;
  }, [paciente.data, doc?.identificacion.fecha_consulta]);

  const alertas = useMemo(
    () =>
      doc
        ? calcularAlertas({
            contenido: doc.secciones,
            alertasIa: doc.alertas,
            resueltas: doc.alertas_resueltas,
            alergiasPaciente: paciente.data?.alergias ?? null,
            esMenor,
          })
        : [],
    [doc, paciente.data?.alergias, esMenor],
  );

  const cambiarCampo = useCallback(
    (ref: CampoRef, valor: ValorCampo) => {
      setErrorServidor(null);
      actualizar((d) => ({ ...d, secciones: { ...d.secciones, [ref.grupo]: { ...d.secciones[ref.grupo], [ref.campo.clave]: valor } } }));
    },
    [actualizar],
  );

  const resolverAlerta = useCallback(
    (id: string, justificacion?: string) =>
      actualizar((d) => ({ ...d, alertas_resueltas: [...d.alertas_resueltas, justificacion ? `${id}::${justificacion}` : id] })),
    [actualizar],
  );

  const alProcesar = useCallback(
    (respuesta: RespuestaProcesar, audio: DatosAudio) => actualizar((d) => fusionarRespuesta(d, respuesta, audio)),
    [actualizar],
  );

  if (paciente.isError) {
    return (
      <div className="p-6">
        <Aviso variante="critical" titulo="No se pudo abrir la consulta">
          {mensajeDeError(paciente.error)} <Link to="/pacientes">Volver a pacientes</Link>
        </Aviso>
      </div>
    );
  }
  if (!paciente.data || !doc) {
    return (
      <div className="p-6">
        <div className="card">
          <Esqueleto etiqueta="Cargando la consulta" lineas={8} />
        </div>
      </div>
    );
  }

  const p = paciente.data;
  const faltantes = calcularFaltantes({
    contenido: doc.secciones,
    identificacion: doc.identificacion,
    modoCaptura: doc.modo_captura,
    consentimiento: doc.consentimiento_grabacion,
  });
  const bloqueos = bloqueosDeAlertas(alertasQueBloquean(alertas));
  const resumen = resumirContenido(doc.secciones);
  const audiosPrevios = new Set(doc.transcripcion.segmentos.map((s) => s.audio ?? 1)).size;
  const cambiarIdentificacion = (cambio: Partial<Borrador["identificacion"]>) =>
    actualizar((d) => ({ ...d, identificacion: { ...d.identificacion, ...cambio } }));

  const confirmarAutorizacion = async () => {
    setErrorServidor(null);
    try {
      const nota = await autorizar.mutateAsync({
        paciente_id: pacienteId,
        plantilla: PLANTILLA,
        fecha_consulta: doc.identificacion.fecha_consulta,
        hora_atencion: doc.identificacion.hora_atencion,
        tipo_consulta: doc.identificacion.tipo_consulta,
        modo_captura: doc.modo_captura ?? "dictado",
        consentimiento_grabacion: doc.consentimiento_grabacion,
        contenido: prepararContenido(doc.secciones),
        transcripcion: doc.transcripcion,
      });
      cerrar(); // Borra el borrador del navegador (RNF-06).
      setDialogo(null);
      const version = nota.versiones.find((v) => v.numero === 1) ?? nota.versiones[0];
      toast.success(`Nota autorizada · ${formatearFechaHora(version?.autorizada_en)}`);
      navegar(`/notas/${nota.id}`, { replace: true });
    } catch (error) {
      setDialogo(null);
      if (error instanceof ErrorApi && error.status === 400) {
        setErrorServidor({ mensaje: error.message, faltantes: error.faltantes });
        if (error.faltantes[0]) irACampo(error.faltantes[0].includes(".") ? error.faltantes[0] : `identificacion.${error.faltantes[0]}`);
      } else {
        setErrorServidor({ mensaje: mensajeDeError(error), faltantes: [] });
      }
    }
  };

  const n = resumen.iaSinCambios;
  const hoy = ahoraEnMexico().fecha;

  return (
    <ProveedorEvidencia>
      <MarcoTrabajo
        cabecera={
          <>
            <CabeceraPaciente paciente={p} fechaReferencia={doc.identificacion.fecha_consulta} flush />
            <BarraTrabajo
              insignia="Borrador · solo en este equipo · no está en el expediente"
              estado={estado}
              guardadoEn={guardadoEn}
              textoDescartar="Descartar borrador"
              onDescartar={() => setDialogo("descartar")}
            >
              <div className="w-40">
                <CampoFecha
                  id="campo-identificacion.fecha_consulta"
                  etiqueta="Fecha"
                  compacto
                  maxima={hoy}
                  valor={doc.identificacion.fecha_consulta}
                  onCambio={(fecha_consulta) => cambiarIdentificacion({ fecha_consulta })}
                />
              </div>
              <CampoHora
                id="campo-identificacion.hora_atencion"
                etiqueta="Hora (24 h)"
                compacto
                valor={doc.identificacion.hora_atencion}
                onCambio={(hora_atencion) => cambiarIdentificacion({ hora_atencion })}
              />
              <Segmentado
                id="campo-identificacion.tipo_consulta"
                etiqueta="Tipo de consulta"
                chico
                className="gap-0.5 [&_legend]:t-caption [&_legend]:mb-0.5 [&_legend]:text-texto-muted"
                valor={doc.identificacion.tipo_consulta}
                onCambio={(tipo_consulta: TipoConsulta) => cambiarIdentificacion({ tipo_consulta })}
                opciones={[
                  { valor: "primera_vez", etiqueta: "Primera vez" },
                  { valor: "seguimiento", etiqueta: "Seguimiento" },
                ]}
              />
            </BarraTrabajo>
          </>
        }
        indice={<IndiceSecciones contenido={doc.secciones} alertas={alertas} faltantes={faltantes.length + bloqueos.length} />}
        panel={<PanelDerecho transcripcion={doc.transcripcion} notas={notas.data} cargandoNotas={notas.isLoading} />}
      >
        <AlertasConsulta alertas={alertas} onResolver={(id) => resolverAlerta(id)} onCambiarPaciente={() => setDialogo("cambiar_paciente")} />
        <Grabadora pacienteId={pacienteId} audiosPrevios={audiosPrevios} onProcesado={alProcesar} />
        <EditorFormato
          contenido={doc.secciones}
          onCambioCampo={cambiarCampo}
          alertas={alertas}
          esMenor={esMenor}
          onResolverAlerta={resolverAlerta}
          revision={
            <SeccionRevision
              resumen={resumen}
              alertasAbiertas={alertasAbiertas(alertas).length}
              faltantes={faltantes}
              bloqueos={bloqueos}
              textoBoton="Autorizar nota"
              enviando={autorizar.isPending}
              onAutorizar={() => setDialogo("autorizar")}
              explicacion="Al autorizar, la nota entra al expediente y se borra el borrador de este equipo."
              errorServidor={
                errorServidor && (
                  <Aviso variante="critical" titulo="La API no aceptó la nota">
                    {errorServidor.mensaje}
                    {errorServidor.faltantes.length > 0 && (
                      <>
                        {" "}
                        Falta:{" "}
                        {errorServidor.faltantes
                          .map((r) => campoPorRuta(r)?.campo.etiqueta ?? ETIQUETAS_IDENTIFICACION[r.replace("identificacion.", "")] ?? r)
                          .join(" · ")}
                        .
                      </>
                    )}
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
        titulo="¿Autorizar la nota?"
        acciones={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDialogo(null)} disabled={autorizar.isPending}>
              Seguir editando
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void confirmarAutorizacion()} disabled={autorizar.isPending}>
              {autorizar.isPending ? "Autorizando…" : "Autorizar nota"}
            </button>
          </>
        }
      >
        La nota se guardará en el expediente de <b className="text-texto">{nombreCabecera(p)}</b> (Exp.{" "}
        <span className="mono text-texto">{p.numero_expediente}</span>). Podrás corregirla después; cada corrección queda registrada como una versión
        nueva.
        {n > 0 && (
          <>
            {" "}
            La IA llenó <b className="text-texto">{n === 1 ? "1 campo" : `${n} campos`}</b> que no cambiaste: al autorizar confirmas que{" "}
            {n === 1 ? "lo revisaste" : "los revisaste"}.
          </>
        )}
      </Dialogo>

      <Dialogo
        abierto={dialogo === "descartar"}
        onCerrar={() => setDialogo(null)}
        titulo="¿Descartar el borrador?"
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
                setDialogo(null);
                toast("Borrador descartado. No se guardó nada en el expediente.");
              }}
            >
              Descartar borrador
            </button>
          </>
        }
      >
        Se borra todo lo capturado en esta consulta. No se puede deshacer.
      </Dialogo>

      <Dialogo
        abierto={dialogo === "cambiar_paciente"}
        onCerrar={() => setDialogo(null)}
        titulo="¿Cambiar de paciente?"
        acciones={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDialogo(null)}>
              Seguir en esta consulta
            </button>
            <button
              type="button"
              className="btn btn-critical"
              onClick={() => {
                descartar();
                setDialogo(null);
                navegar("/pacientes");
              }}
            >
              Descartar y elegir otro paciente
            </button>
          </>
        }
      >
        Se descarta este borrador de {nombreCabecera(p)} para que nada quede en el expediente equivocado. Elige al paciente correcto y vuelve a
        procesar el audio.
      </Dialogo>
    </ProveedorEvidencia>
  );
}
