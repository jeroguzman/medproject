import { BookOpen, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useEvidencia } from "@/components/consulta/ContextoEvidencia";
import { InsigniaOrigen } from "@/components/consulta/InsigniaOrigen";
import { ZonaEvidencia } from "@/components/consulta/ZonaEvidencia";
import { Aviso } from "@/components/ui/Aviso";
import { Insignia } from "@/components/ui/Insignia";
import { Segmentado } from "@/components/ui/Segmentado";
import type { AlertaVista } from "@/lib/alertas";
import { idCampo, origenTrasEditar, type CampoRef } from "@/lib/contenido";
import type { Condicion, Diagnostico, Medicamento } from "@/plantilla/valores";
import { MarcoCampo, MensajeAlerta } from "./MarcoCampo";

/** Un renglón editado: lo de la IA pasa a "editado"; lo demás queda "manual". */
const editarRenglon = <T extends Diagnostico | Medicamento>(row: T, cambio: Partial<T>): T => ({
  ...row,
  ...cambio,
  origen: origenTrasEditar(row.origen, false),
});

const enfocarDespues = (id: string) => window.setTimeout(() => document.getElementById(id)?.focus(), 0);

/** Abre la pestaña de referencias de apoyo (Tavily) con el término del renglón. Solo viaja el término. */
function BotonReferencias({ termino }: { termino: string }) {
  const { verReferencias } = useEvidencia();
  if (termino.trim().length < 3) return null;
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm ml-auto"
      title="Buscar información de apoyo en fuentes confiables"
      onClick={() => verReferencias(termino.trim())}
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      Referencias
    </button>
  );
}

function SinInformacion() {
  return <p className="t-body-sm rounded-md border border-dashed border-input bg-canvas px-3 py-2 text-texto-subtle">— Sin información</p>;
}

interface PropsDx {
  refCampo: CampoRef;
  valor: Diagnostico[];
  onCambio: (v: Diagnostico[]) => void;
  avisos: AlertaVista[];
}

/** diagnosticos: renglones con descripción y condición (Confirmado / Presuntivo / Por determinar). */
export function ListaDiagnosticos({ refCampo, valor, onCambio, avisos }: PropsDx) {
  const base = idCampo(refCampo.ruta);
  const cambiar = (i: number, cambio: Partial<Diagnostico>) => onCambio(valor.map((d, j) => (j === i ? editarRenglon(d, cambio) : d)));
  const agregar = () => {
    onCambio([...valor, { descripcion: "", condicion: null, evidencia: null, origen: "manual" }]);
    enfocarDespues(`${base}-${valor.length}-descripcion`);
  };
  const quitar = (i: number) => {
    onCambio(valor.filter((_, j) => j !== i));
    enfocarDespues(`${base}-agregar`);
  };

  return (
    <MarcoCampo refCampo={refCampo} avisos={avisos.filter((a) => a.campo === refCampo.ruta || a.tipo === "sin_evidencia")} ancho>
      <div className="grid gap-3" role="group" aria-labelledby={`${base}-etiqueta`}>
        {valor.length === 0 && <SinInformacion />}
        {valor.map((d, i) => (
          <ZonaEvidencia key={i} ruta={`${refCampo.ruta}[${i}]`} citas={d.evidencia} activa={d.origen === "ia" || d.origen === "editado"}>
            <div className="grid gap-3 rounded-lg border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-label">{i === 0 ? "Diagnóstico principal" : `Diagnóstico ${i + 1}`}</span>
                <InsigniaOrigen origen={d.origen} />
                <BotonReferencias termino={d.descripcion} />
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm btn-icon ${d.descripcion.trim().length < 3 ? "ml-auto" : ""}`}
                  aria-label={`Quitar diagnóstico ${i + 1}`}
                  title="Quitar diagnóstico"
                  onClick={() => quitar(i)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="field">
                <label className="t-caption text-texto-muted" htmlFor={`${base}-${i}-descripcion`}>
                  Descripción
                </label>
                <input
                  id={`${base}-${i}-descripcion`}
                  className="input"
                  autoComplete="off"
                  placeholder="Diagnóstico o problema clínico"
                  value={d.descripcion}
                  onChange={(e) => cambiar(i, { descripcion: e.target.value })}
                />
              </div>
              <Segmentado
                etiqueta="Condición"
                chico
                className="[&_legend]:t-caption [&_legend]:text-texto-muted"
                valor={d.condicion}
                onCambio={(condicion: Condicion) => cambiar(i, { condicion })}
                opciones={[
                  { valor: "confirmado", etiqueta: "Confirmado" },
                  { valor: "presuntivo", etiqueta: "Presuntivo" },
                  { valor: "por_determinar", etiqueta: "Por determinar" },
                ]}
              />
              {d.descripcion.trim() !== "" && !d.condicion && (
                <p className="msg msg-warning">Elige la condición: es obligatoria para autorizar.</p>
              )}
            </div>
          </ZonaEvidencia>
        ))}
        <button type="button" id={`${base}-agregar`} className="btn btn-secondary btn-sm justify-self-start" onClick={agregar}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar diagnóstico
        </button>
      </div>
    </MarcoCampo>
  );
}

interface PropsRx {
  refCampo: CampoRef;
  valor: Medicamento[];
  onCambio: (v: Medicamento[]) => void;
  avisos: AlertaVista[];
  onResolverAlerta: (id: string, justificacion: string) => void;
}

const COLUMNAS_RX: Array<{ clave: keyof Medicamento; etiqueta: string; ejemplo: string }> = [
  { clave: "dosis", etiqueta: "Dosis", ejemplo: "500 mg" },
  { clave: "via", etiqueta: "Vía", ejemplo: "oral" },
  { clave: "frecuencia", etiqueta: "Frecuencia", ejemplo: "cada 8 h" },
  { clave: "duracion", etiqueta: "Duración", ejemplo: "3 días" },
];

/** medicamentos: renglones con medicamento, dosis, vía, frecuencia y duración. */
export function ListaMedicamentos({ refCampo, valor, onCambio, avisos, onResolverAlerta }: PropsRx) {
  const base = idCampo(refCampo.ruta);
  const [justificando, setJustificando] = useState<string | null>(null);
  const [justificacion, setJustificacion] = useState("");
  const cambiar = (i: number, cambio: Partial<Medicamento>) => onCambio(valor.map((m, j) => (j === i ? editarRenglon(m, cambio) : m)));
  const agregar = () => {
    onCambio([...valor, { medicamento: "", dosis: null, via: null, frecuencia: null, duracion: null, evidencia: null, origen: "manual" }]);
    enfocarDespues(`${base}-${valor.length}-medicamento`);
  };
  const quitar = (i: number) => {
    onCambio(valor.filter((_, j) => j !== i));
    enfocarDespues(`${base}-agregar`);
  };

  return (
    <MarcoCampo refCampo={refCampo} avisos={avisos.filter((a) => a.campo === refCampo.ruta || a.tipo === "sin_evidencia")} ancho>
      <div className="grid gap-3" role="group" aria-labelledby={`${base}-etiqueta`}>
        {valor.length === 0 && <SinInformacion />}
        {valor.map((m, i) => {
          const alergia = avisos.find((a) => a.tipo === "alergia_medicamento" && a.campo === `${refCampo.ruta}[${i}]`);
          const bloqueado = alergia && !alergia.resuelta;
          return (
            <ZonaEvidencia key={i} ruta={`${refCampo.ruta}[${i}]`} citas={m.evidencia} activa={m.origen === "ia" || m.origen === "editado"}>
              <div className={`grid gap-3 rounded-lg border bg-surface p-3 ${bloqueado ? "border-critico-solid" : "border-border"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="t-label">Medicamento {i + 1}</span>
                  <InsigniaOrigen origen={m.origen} />
                  {alergia?.resuelta && (
                    <Insignia variante="neutral" icono={ShieldCheck}>
                      Alergia revisada
                    </Insignia>
                  )}
                  <BotonReferencias termino={m.medicamento} />
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm btn-icon ${m.medicamento.trim().length < 3 ? "ml-auto" : ""}`}
                    aria-label={`Quitar medicamento ${i + 1}`}
                    title="Quitar medicamento"
                    onClick={() => quitar(i)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="field">
                  <label className="t-caption text-texto-muted" htmlFor={`${base}-${i}-medicamento`}>
                    Medicamento
                  </label>
                  <input
                    id={`${base}-${i}-medicamento`}
                    className="input"
                    autoComplete="off"
                    placeholder="Nombre genérico"
                    value={m.medicamento}
                    onChange={(e) => cambiar(i, { medicamento: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {COLUMNAS_RX.map((c) => (
                    <div className="field" key={c.clave}>
                      <label className="t-caption text-texto-muted" htmlFor={`${base}-${i}-${c.clave}`}>
                        {c.etiqueta}
                      </label>
                      <input
                        id={`${base}-${i}-${c.clave}`}
                        className="input"
                        autoComplete="off"
                        placeholder={`— (ej. ${c.ejemplo})`}
                        value={(m[c.clave] as string | null) ?? ""}
                        onChange={(e) => cambiar(i, { [c.clave]: e.target.value === "" ? null : e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                {bloqueado && (
                  <Aviso
                    variante="critical"
                    titulo="Alergia registrada"
                    acciones={
                      justificando === alergia.id ? null : (
                        <>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => quitar(i)}>
                            Quitar medicamento
                          </button>
                          <button
                            type="button"
                            className="btn btn-critical-ghost btn-sm"
                            onClick={() => {
                              setJustificando(alergia.id);
                              setJustificacion("");
                              enfocarDespues(`${base}-${i}-justificacion`);
                            }}
                          >
                            Indicar con justificación…
                          </button>
                        </>
                      )
                    }
                  >
                    {alergia.mensaje}
                    {justificando === alergia.id && (
                      <div className="mt-3 grid gap-2">
                        <label className="t-label" htmlFor={`${base}-${i}-justificacion`}>
                          ¿Por qué lo indicas de todos modos?
                        </label>
                        <textarea
                          id={`${base}-${i}-justificacion`}
                          className="textarea"
                          rows={2}
                          value={justificacion}
                          onChange={(e) => setJustificacion(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setJustificando(null)}>
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn btn-critical btn-sm"
                            disabled={justificacion.trim().length < 5}
                            onClick={() => {
                              onResolverAlerta(alergia.id, justificacion.trim());
                              setJustificando(null);
                            }}
                          >
                            Indicar de todos modos
                          </button>
                        </div>
                      </div>
                    )}
                  </Aviso>
                )}
                {alergia && !bloqueado && <MensajeAlerta alerta={{ ...alergia, severidad: "advertencia" }} />}
              </div>
            </ZonaEvidencia>
          );
        })}
        <button type="button" id={`${base}-agregar`} className="btn btn-secondary btn-sm justify-self-start" onClick={agregar}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar medicamento
        </button>
      </div>
    </MarcoCampo>
  );
}
