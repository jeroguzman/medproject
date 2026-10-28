import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Aviso } from "@/components/ui/Aviso";
import type { AlertaVista } from "@/lib/alertas";
import { campoPorRuta, type Faltante, type Resumen } from "@/lib/contenido";
import { irACampo } from "@/lib/navegacion";

export interface Bloqueo {
  ruta: string;
  etiqueta: string;
}

/** Bloqueos de autorizar a partir de las alertas (paciente que no coincide, valor imposible, alergia). */
export function bloqueosDeAlertas(alertas: AlertaVista[]): Bloqueo[] {
  return alertas.map((a) => {
    const ruta = a.campo ?? "alerta-paciente";
    const campo = a.campo ? campoPorRuta(a.campo)?.campo.etiqueta : null;
    const etiqueta =
      a.tipo === "paciente_no_coincide"
        ? "Confirma que es el paciente correcto"
        : a.tipo === "valor_imposible"
          ? `Corrige ${campo?.toLowerCase() ?? "el valor"}`
          : a.tipo === "alergia_medicamento"
            ? "Revisa la alergia del medicamento"
            : (campo ?? a.mensaje);
    return { ruta, etiqueta };
  });
}

function Cifra({ valor, etiqueta, nota }: { valor: number; etiqueta: string; nota?: string }) {
  return (
    <div className="grid gap-0.5 rounded-lg border border-border bg-canvas p-3">
      <span className="t-display tnum leading-none">{valor}</span>
      <span className="t-label">{etiqueta}</span>
      {nota && <span className="t-caption text-texto-muted">{nota}</span>}
    </div>
  );
}

interface Props {
  resumen: Resumen;
  alertasAbiertas: number;
  faltantes: Faltante[];
  bloqueos: Bloqueo[];
  textoBoton: string;
  enviando: boolean;
  onAutorizar: () => void;
  /** Texto sobre la consecuencia de autorizar. */
  explicacion: ReactNode;
  /** Errores de validación que devolvió la API (400). */
  errorServidor?: ReactNode;
}

/**
 * Sección 09 "Revisión y autorización": resumen y el único paso que exige los obligatorios (prompt 8).
 * Si falta algo, el botón dice qué es y lleva al campo.
 */
export function SeccionRevision({ resumen, alertasAbiertas, faltantes, bloqueos, textoBoton, enviando, onAutorizar, explicacion, errorServidor }: Props) {
  const pendientes = [...faltantes.map((f) => ({ ruta: f.ruta, etiqueta: f.etiqueta })), ...bloqueos];
  const puede = pendientes.length === 0 && !enviando;

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Cifra valor={resumen.iaSinCambios} etiqueta="De la IA sin cambios" nota="Revísalos antes de autorizar" />
        <Cifra valor={resumen.editados} etiqueta="Editados" />
        <Cifra valor={resumen.manuales} etiqueta="Capturados a mano" />
        <Cifra valor={resumen.vacios} etiqueta="Vacíos" nota="Quedan como «Sin información»" />
        <Cifra valor={alertasAbiertas} etiqueta="Alertas abiertas" />
      </div>

      {errorServidor}

      {pendientes.length > 0 ? (
        <Aviso variante="warning" titulo="Para autorizar falta:">
          <ul className="mt-1 grid gap-1">
            {pendientes.map((p, i) => (
              <li key={`${p.ruta}-${i}`}>
                <button type="button" className="font-semibold text-accion-texto underline underline-offset-2" onClick={() => irACampo(p.ruta)}>
                  {p.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        </Aviso>
      ) : (
        <Aviso variante="success" titulo="Todo lo obligatorio está completo">
          Revisa los campos que llenó la IA: al autorizar confirmas que los revisaste.
        </Aviso>
      )}

      <div className="grid justify-items-start gap-2">
        <button
          type="button"
          className="btn btn-primary"
          aria-disabled={!puede}
          aria-describedby="autorizar-falta"
          onClick={() => {
            if (enviando) return;
            if (pendientes.length > 0) irACampo(pendientes[0].ruta);
            else onAutorizar();
          }}
        >
          {puede ? <ShieldCheck className="h-5 w-5" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          {enviando ? "Autorizando…" : textoBoton}
        </button>
        <p id="autorizar-falta" className="t-body-sm text-texto-muted" aria-live="polite">
          {pendientes.length > 0 ? (
            <>
              <b className="text-advertencia-fg">Falta: {pendientes.map((p) => p.etiqueta).join(" · ")}</b>. Pulsa el botón para ir al primero.
            </>
          ) : (
            explicacion
          )}
        </p>
      </div>
    </div>
  );
}
