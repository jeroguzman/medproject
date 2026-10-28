import { Calculator, CheckCircle2, CircleAlert, Minus, OctagonAlert, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Segmentado } from "@/components/ui/Segmentado";
import type { AlertaVista } from "@/lib/alertas";
import { conOrigenEditado, idCampo, type CampoRef } from "@/lib/contenido";
import { leerNumero } from "@/lib/formatos";
import { irAlSiguienteVital } from "@/lib/navegacion";
import { cn } from "@/lib/utils";
import { calcularImc, evaluarPresion, evaluarVital, type EvaluacionVital } from "@/lib/vitales";
import type { CampoPresion, CampoVital, EstadoVital } from "@/plantilla/valores";
import { MarcoCampo } from "./MarcoCampo";

const CLASE_ESTADO = { vacio: "", ok: "", advertencia: "is-warning", critico: "is-critical", error: "is-error" } as const;

/** Línea de estado bajo el signo vital: color, icono y palabra (DS 7.3). */
function EstadoVitalLinea({ ev, idLinea, onSugerencia }: { ev: EvaluacionVital; idLinea: string; onSugerencia?: (n: number) => void }) {
  const config = {
    vacio: { clase: "s-empty", Icono: Minus },
    ok: { clase: "s-ok", Icono: CheckCircle2 },
    advertencia: { clase: "s-warn", Icono: TriangleAlert },
    critico: { clase: "s-crit", Icono: OctagonAlert },
    error: { clase: "s-err", Icono: CircleAlert },
  }[ev.nivel];
  return (
    <div id={idLinea} className={cn("vstatus", config.clase)} aria-live="polite">
      <config.Icono aria-hidden="true" />
      <span>
        {ev.nivel === "vacio" ? "Sin información" : ev.mensaje}
        {ev.sugerencia !== undefined && onSugerencia && (
          <button type="button" className="btn btn-secondary btn-sm ml-2" onClick={() => onSugerencia(ev.sugerencia!)}>
            Usar {ev.sugerencia}
          </button>
        )}
      </span>
    </div>
  );
}

function SelectorMedicion({ estado, onCambio, deshabilitado, etiqueta }: { estado: EstadoVital; onCambio: (e: EstadoVital) => void; deshabilitado: boolean; etiqueta: string }) {
  return (
    <Segmentado
      etiqueta={`¿${etiqueta} medida o referida?`}
      ocultarEtiqueta
      chico
      deshabilitado={deshabilitado}
      valor={estado === "sin_informacion" ? null : estado}
      onCambio={onCambio}
      opciones={[
        { valor: "medido", etiqueta: "Medido" },
        { valor: "referido", etiqueta: "Referido" },
      ]}
    />
  );
}

/** Campo numérico que conserva lo que se escribe mientras no es un número válido. */
function useTextoNumero(valor: number | null) {
  const [texto, setTexto] = useState(valor === null ? "" : String(valor));
  // Solo se sincroniza cuando cambia el valor guardado (por ejemplo, al fusionar otro audio).
  useEffect(() => {
    const leido = leerNumero(texto);
    if (leido === valor || (leido !== null && Number.isNaN(leido))) return;
    setTexto(valor === null ? "" : String(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return [texto, setTexto] as const;
}

const alPulsarEnter = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    irAlSiguienteVital(e.currentTarget);
  }
};

interface PropsVital {
  refCampo: CampoRef;
  valor: CampoVital;
  onCambio: (v: CampoVital) => void;
  avisos: AlertaVista[];
  esMenor: boolean;
}

/** vital: número con la unidad dentro del campo, inputmode decimal y Medido / Referido. */
export function CampoVitalEditor({ refCampo, valor: v, onCambio, avisos, esMenor }: PropsVital) {
  const id = `${idCampo(refCampo.ruta)}-control`;
  const [texto, setTexto] = useTextoNumero(v.valor);
  const leido = leerNumero(texto);
  const ev = leido !== null && Number.isNaN(leido) ? evaluarVital(refCampo.campo.clave, Number.NaN) : evaluarVital(refCampo.campo.clave, v.valor, esMenor);

  const guardar = (numero: number | null) => {
    const estado: EstadoVital = numero === null ? "sin_informacion" : v.estado === "sin_informacion" ? "medido" : v.estado;
    onCambio(conOrigenEditado(v, { ...v, valor: numero, unidad: refCampo.campo.unidad, estado }));
  };

  return (
    <MarcoCampo
      refCampo={refCampo}
      idControl={id}
      origen={v.origen}
      evidencia={v.evidencia}
      avisos={avisos}
    >
      <div className={cn("flex flex-wrap items-center gap-2", CLASE_ESTADO[ev.nivel])}>
        <div className="input-wrap w-36">
          <input
            id={id}
            data-vital
            className="input tnum text-right"
            inputMode="decimal"
            autoComplete="off"
            placeholder="—"
            value={texto}
            aria-invalid={ev.nivel === "error" || undefined}
            aria-describedby={`${id}-unidad ${id}-estado`}
            onKeyDown={alPulsarEnter}
            onChange={(e) => {
              setTexto(e.target.value);
              const n = leerNumero(e.target.value);
              if (n === null || !Number.isNaN(n)) guardar(n);
            }}
            onBlur={() => {
              if (leido !== null && Number.isNaN(leido)) setTexto(v.valor === null ? "" : String(v.valor));
            }}
          />
          <span id={`${id}-unidad`} className="unit">
            {refCampo.campo.unidad}
          </span>
        </div>
        <SelectorMedicion
          etiqueta={refCampo.campo.etiqueta}
          estado={v.estado}
          deshabilitado={v.valor === null}
          onCambio={(estado) => onCambio(conOrigenEditado(v, { ...v, estado }))}
        />
      </div>
      <EstadoVitalLinea ev={ev} idLinea={`${id}-estado`} onSugerencia={(n) => guardar(n)} />
    </MarcoCampo>
  );
}

interface PropsPresion {
  refCampo: CampoRef;
  valor: CampoPresion;
  onCambio: (v: CampoPresion) => void;
  avisos: AlertaVista[];
  esMenor: boolean;
}

/** presion: dos números con "/" entre ellos; al escribir "/" el foco pasa a la diastólica. */
export function CampoPresionEditor({ refCampo, valor: v, onCambio, avisos, esMenor }: PropsPresion) {
  const id = `${idCampo(refCampo.ruta)}-control`;
  const diastolica = useRef<HTMLInputElement>(null);
  const [textoS, setTextoS] = useTextoNumero(v.valor?.sistolica ?? null);
  const [textoD, setTextoD] = useTextoNumero(v.valor?.diastolica ?? null);
  const ev = evaluarPresion(v, esMenor);

  const guardar = (sistolica: number | null, diast: number | null) => {
    const hay = sistolica !== null || diast !== null;
    const estado: EstadoVital = !hay ? "sin_informacion" : v.estado === "sin_informacion" ? "medido" : v.estado;
    onCambio(conOrigenEditado(v, { ...v, valor: hay ? { sistolica, diastolica: diast } : null, unidad: "mmHg", estado }));
  };
  const entero = (t: string) => {
    const n = leerNumero(t);
    return n === null || Number.isNaN(n) ? null : Math.round(n);
  };

  return (
    <MarcoCampo refCampo={refCampo} idControl={id} origen={v.origen} evidencia={v.evidencia} avisos={avisos}>
      <div className={cn("flex flex-wrap items-center gap-2", CLASE_ESTADO[ev.nivel])}>
        <div className="input-wrap w-44">
          <input
            id={id}
            data-vital
            className="input tnum text-right"
            inputMode="numeric"
            autoComplete="off"
            placeholder="—"
            aria-label="Sistólica"
            aria-describedby={`${id}-estado`}
            value={textoS}
            onKeyDown={(e) => {
              if (e.key === "/") {
                e.preventDefault();
                diastolica.current?.focus();
              } else alPulsarEnter(e);
            }}
            onChange={(e) => {
              setTextoS(e.target.value);
              guardar(entero(e.target.value), v.valor?.diastolica ?? null);
            }}
          />
          <span className="sep" aria-hidden="true">
            /
          </span>
          <input
            ref={diastolica}
            data-vital
            className="input tnum"
            inputMode="numeric"
            autoComplete="off"
            placeholder="—"
            aria-label="Diastólica"
            aria-describedby={`${id}-estado`}
            value={textoD}
            onKeyDown={alPulsarEnter}
            onChange={(e) => {
              setTextoD(e.target.value);
              guardar(v.valor?.sistolica ?? null, entero(e.target.value));
            }}
          />
          <span className="unit">mmHg</span>
        </div>
        <SelectorMedicion
          etiqueta="Presión arterial"
          estado={v.estado}
          deshabilitado={v.valor === null}
          onCambio={(estado) => onCambio(conOrigenEditado(v, { ...v, estado }))}
        />
      </div>
      <EstadoVitalLinea ev={ev} idLinea={`${id}-estado`} />
    </MarcoCampo>
  );
}

/** imc: solo lectura, calculado con peso y talla en cm. No se guarda. */
export function CampoImc({ refCampo, peso, talla, esMenor }: { refCampo: CampoRef; peso?: CampoVital; talla?: CampoVital; esMenor: boolean }) {
  const imc = calcularImc(peso, talla, esMenor);
  return (
    <MarcoCampo refCampo={refCampo}>
      <div className="calc max-w-xs" aria-live="polite">
        {imc ? (
          <>
            <b className="tnum">
              {imc.valor} <span className="t-body-sm font-normal text-texto-muted">kg/m²</span>
            </b>
            <span>{imc.clasificacion ?? "Calculado"}</span>
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Se calcula con peso y talla
          </span>
        )}
      </div>
    </MarcoCampo>
  );
}
