import { Ban, CircleAlert, OctagonAlert, TriangleAlert } from "lucide-react";
import { InsigniaOrigen } from "@/components/consulta/InsigniaOrigen";
import { Insignia } from "@/components/ui/Insignia";
import { CAMPOS, estaVacio, obtenerValor, type CampoRef } from "@/lib/contenido";
import { formatearNumero } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import { calcularImc, evaluarPresion, evaluarVital, type EvaluacionVital } from "@/lib/vitales";
import { FORMATO_CLINICO_GENERAL } from "@/plantilla/formatoClinicoGeneral";
import type { CampoPresion, CampoTexto, CampoVital, Contenido, Diagnostico, Medicamento } from "@/plantilla/valores";

const CONDICION: Record<string, string> = { confirmado: "Confirmado", presuntivo: "Presuntivo", por_determinar: "Por determinar" };
const MEDICION: Record<string, string> = { medido: "Medido", referido: "Referido" };

function SinInformacion() {
  return <span className="text-texto-subtle">— Sin información</span>;
}

/** Marca de rango en lectura: "Se guardará marcado en la nota" (DS 7.2). */
function MarcaRango({ ev }: { ev: EvaluacionVital }) {
  if (ev.nivel === "advertencia")
    return (
      <span className="vstatus s-warn">
        <TriangleAlert aria-hidden="true" />
        Fuera de rango
      </span>
    );
  if (ev.nivel === "critico")
    return (
      <span className="vstatus s-crit">
        <OctagonAlert aria-hidden="true" />
        Crítico
      </span>
    );
  if (ev.nivel === "error")
    return (
      <span className="vstatus s-err">
        <CircleAlert aria-hidden="true" />
        Valor no válido
      </span>
    );
  return null;
}

interface Props {
  contenido: Contenido;
  esMenor: boolean;
  impresion?: boolean;
}

/** Formato completo en solo lectura (RF-07): la nota autorizada, una versión anterior o la vista de impresión. */
export function NotaLectura({ contenido, esMenor, impresion }: Props) {
  const valorDe = (ref: CampoRef) => {
    const v = obtenerValor(contenido, ref);
    switch (ref.campo.tipo) {
      case "texto":
      case "textoLargo":
      case "antecedente": {
        const t = v as CampoTexto;
        if (estaVacio(t)) return <SinInformacion />;
        return <span className="whitespace-pre-wrap">{t.valor}</span>;
      }
      case "vital": {
        const t = v as CampoVital;
        if (t.valor === null) return <SinInformacion />;
        return (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="tnum font-semibold">
              {formatearNumero(t.valor, ref.campo.clave === "temperatura" || ref.campo.clave === "peso" ? 1 : 0)} {ref.campo.unidad}
            </span>
            <span className="t-caption text-texto-muted">{MEDICION[t.estado] ?? ""}</span>
            <MarcaRango ev={evaluarVital(ref.campo.clave, t.valor, esMenor)} />
          </span>
        );
      }
      case "presion": {
        const t = v as CampoPresion;
        if (estaVacio(t)) return <SinInformacion />;
        return (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="tnum font-semibold">
              {t.valor?.sistolica ?? "—"}/{t.valor?.diastolica ?? "—"} mmHg
            </span>
            <span className="t-caption text-texto-muted">{MEDICION[t.estado] ?? ""}</span>
            <MarcaRango ev={evaluarPresion(t, esMenor)} />
          </span>
        );
      }
      case "imc": {
        const imc = calcularImc(contenido.signos_vitales?.peso as CampoVital, contenido.signos_vitales?.talla as CampoVital, esMenor);
        if (!imc) return <SinInformacion />;
        return (
          <span className="tnum">
            <b>{imc.valor} kg/m²</b>
            {imc.clasificacion && <span className="text-texto-muted"> · {imc.clasificacion}</span>}
            <span className="t-caption text-texto-muted"> · calculado</span>
          </span>
        );
      }
      case "diagnosticos": {
        const lista = v as Diagnostico[];
        if (lista.length === 0) return <SinInformacion />;
        return (
          <ol className="grid gap-1.5">
            {lista.map((d, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span className="tnum text-texto-subtle">{i + 1}.</span>
                <b>{d.descripcion}</b>
                <span className="text-texto-muted">· {d.condicion ? CONDICION[d.condicion] : "Sin condición"}</span>
                {i === 0 && lista.length > 1 && <span className="t-caption text-texto-muted">(principal)</span>}
                {!impresion && <InsigniaOrigen origen={d.origen} />}
              </li>
            ))}
          </ol>
        );
      }
      case "medicamentos": {
        const lista = v as Medicamento[];
        if (lista.length === 0) return <SinInformacion />;
        return (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="t-caption text-texto-muted">
                <th className="py-1 pr-3 font-semibold">Medicamento</th>
                <th className="py-1 pr-3 font-semibold">Dosis</th>
                <th className="py-1 pr-3 font-semibold">Vía</th>
                <th className="py-1 pr-3 font-semibold">Frecuencia</th>
                <th className="py-1 pr-3 font-semibold">Duración</th>
                {!impresion && <th className="sr-only">Origen</th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((m, i) => (
                <tr key={i} className="border-t border-border align-top">
                  <td className="py-1.5 pr-3 font-semibold">{m.medicamento}</td>
                  <td className="tnum py-1.5 pr-3">{m.dosis ?? "—"}</td>
                  <td className="py-1.5 pr-3">{m.via ?? "—"}</td>
                  <td className="py-1.5 pr-3">{m.frecuencia ?? "—"}</td>
                  <td className="py-1.5 pr-3">{m.duracion ?? "—"}</td>
                  {!impresion && (
                    <td className="py-1.5">
                      <InsigniaOrigen origen={m.origen} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    }
  };

  return (
    <div className={cn("grid", impresion ? "gap-4" : "gap-5")}>
      {FORMATO_CLINICO_GENERAL.filter((s) => s.id !== "revision").map((s) => (
        <section key={s.id} aria-labelledby={`lectura-${s.id}`} className={impresion ? "break-inside-avoid" : "card p-5"}>
          <h2
            id={`lectura-${s.id}`}
            className={cn("flex items-baseline gap-3", impresion ? "t-label mb-2 border-b border-texto pb-1 text-base uppercase" : "t-title-md mb-4")}
          >
            <span className="mono text-texto-subtle">{s.numero}</span>
            {s.titulo}
          </h2>
          {s.grupos.map((g) => (
            <div key={g.clave} className="mb-3 last:mb-0">
              {g.titulo && <h3 className={cn("t-label mb-2 text-texto-muted", impresion && "text-sm")}>{g.titulo}</h3>}
              <dl className={cn("grid gap-x-6", impresion ? "gap-y-1.5" : "gap-y-3", g.clave === "signos_vitales" && "md:grid-cols-2 print:grid-cols-2")}>
                {CAMPOS.filter((c) => c.grupo === g.clave).map((ref) => {
                  const v = obtenerValor(contenido, ref);
                  const origen = Array.isArray(v) ? undefined : v.origen;
                  const negado = !Array.isArray(v) && "estado" in v && v.estado === "negado";
                  return (
                    <div key={ref.ruta} className={cn("grid gap-0.5", impresion && "grid-cols-[minmax(0,14rem)_1fr] gap-x-3")}>
                      <dt className={cn("flex flex-wrap items-center gap-2", impresion ? "t-body-sm font-semibold" : "t-label text-texto-muted")}>
                        {ref.campo.etiqueta}
                        {!impresion && <InsigniaOrigen origen={origen} />}
                        {negado && (
                          <Insignia variante="neutral" icono={Ban}>
                            Negado
                          </Insignia>
                        )}
                      </dt>
                      <dd className="t-body m-0">{valorDe(ref)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
