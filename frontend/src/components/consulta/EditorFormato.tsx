import type { KeyboardEvent, ReactNode } from "react";
import { alertasDeCampo, type AlertaVista } from "@/lib/alertas";
import { CAMPOS, obtenerValor, type CampoRef } from "@/lib/contenido";
import { irASeccionSiguiente } from "@/lib/navegacion";
import { FORMATO_CLINICO_GENERAL } from "@/plantilla/formatoClinicoGeneral";
import type { CampoPresion, CampoTexto, CampoVital, Contenido, Diagnostico, Medicamento, ValorCampo } from "@/plantilla/valores";
import { CampoAntecedente, CampoTextoEditor } from "./campos/CampoTextoEditor";
import { CampoImc, CampoPresionEditor, CampoVitalEditor } from "./campos/CamposVitales";
import { ListaDiagnosticos, ListaMedicamentos } from "./campos/Listas";

/** Alertas que se muestran junto al campo (las de signos vitales las pinta el propio campo). */
const avisosVisibles = (alertas: AlertaVista[], ruta: string) =>
  alertasDeCampo(alertas, ruta).filter((a) => a.tipo !== "valor_imposible" && a.tipo !== "fuera_de_rango");

interface Props {
  contenido: Contenido;
  onCambioCampo: (ref: CampoRef, valor: ValorCampo) => void;
  alertas: AlertaVista[];
  esMenor: boolean;
  onResolverAlerta: (id: string, justificacion?: string) => void;
  /** Contenido de la sección 09 (resumen y autorizar). */
  revision: ReactNode;
}

/**
 * Formulario generado desde src/plantilla/formatoClinicoGeneral.ts (prompt 5). Las secciones se recorren en
 * cualquier orden y Ctrl + Enter pasa a la siguiente.
 */
export function EditorFormato({ contenido, onCambioCampo, alertas, esMenor, onResolverAlerta, revision }: Props) {
  const alPulsar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      irASeccionSiguiente(e.target as Element);
    }
  };

  const renderCampo = (ref: CampoRef) => {
    const valor = obtenerValor(contenido, ref);
    const avisos = avisosVisibles(alertas, ref.ruta);
    const cambiar = (v: ValorCampo) => onCambioCampo(ref, v);
    switch (ref.campo.tipo) {
      case "texto":
      case "textoLargo":
        return <CampoTextoEditor key={ref.ruta} refCampo={ref} valor={valor as CampoTexto} onCambio={cambiar} avisos={avisos} />;
      case "antecedente":
        return <CampoAntecedente key={ref.ruta} refCampo={ref} valor={valor as CampoTexto} onCambio={cambiar} avisos={avisos} />;
      case "vital":
        return <CampoVitalEditor key={ref.ruta} refCampo={ref} valor={valor as CampoVital} onCambio={cambiar} avisos={avisos} esMenor={esMenor} />;
      case "presion":
        return (
          <CampoPresionEditor key={ref.ruta} refCampo={ref} valor={valor as CampoPresion} onCambio={cambiar} avisos={avisos} esMenor={esMenor} />
        );
      case "imc":
        return (
          <CampoImc
            key={ref.ruta}
            refCampo={ref}
            peso={contenido.signos_vitales?.peso as CampoVital | undefined}
            talla={contenido.signos_vitales?.talla as CampoVital | undefined}
            esMenor={esMenor}
          />
        );
      case "diagnosticos":
        return <ListaDiagnosticos key={ref.ruta} refCampo={ref} valor={valor as Diagnostico[]} onCambio={cambiar} avisos={alertasDeCampo(alertas, ref.ruta)} />;
      case "medicamentos":
        return (
          <ListaMedicamentos
            key={ref.ruta}
            refCampo={ref}
            valor={valor as Medicamento[]}
            onCambio={cambiar}
            avisos={alertasDeCampo(alertas, ref.ruta)}
            onResolverAlerta={onResolverAlerta}
          />
        );
    }
  };

  return (
    <div className="grid gap-6" onKeyDown={alPulsar}>
      {FORMATO_CLINICO_GENERAL.map((seccion) => (
        <section
          key={seccion.id}
          id={`seccion-${seccion.id}`}
          data-seccion={seccion.id}
          aria-labelledby={`titulo-${seccion.id}`}
          className="card scroll-mt-[calc(var(--alto-cabecera,48px)+16px)] p-5"
        >
          <h2 id={`titulo-${seccion.id}`} tabIndex={-1} className="t-title-md mb-4 flex items-baseline gap-3 outline-none">
            <span className="mono t-body text-texto-subtle">{seccion.numero}</span>
            {seccion.titulo}
          </h2>
          {seccion.id === "revision" ? (
            revision
          ) : (
            <div className="grid gap-6">
              {seccion.grupos.map((grupo) => {
                const campos = CAMPOS.filter((c) => c.grupo === grupo.clave);
                const esVital = grupo.clave === "signos_vitales";
                return (
                  <div key={grupo.clave} className="grid gap-4">
                    {grupo.titulo && <h3 className="t-title-sm border-b border-border pb-2">{grupo.titulo}</h3>}
                    <div className={esVital ? "grid gap-x-6 gap-y-5 md:grid-cols-2" : "grid gap-5 md:grid-cols-2"}>
                      {campos.map(renderCampo)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
      <p className="t-body-sm text-center text-texto-muted">
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd> pasa a la sección siguiente · <kbd>Enter</kbd> en los signos vitales pasa al siguiente ·{" "}
        <kbd>/</kbd> en la presión salta a la diastólica
      </p>
    </div>
  );
}
