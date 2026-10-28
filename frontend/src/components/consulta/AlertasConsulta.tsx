import { UserX } from "lucide-react";
import { Aviso } from "@/components/ui/Aviso";
import type { AlertaVista } from "@/lib/alertas";

interface Props {
  alertas: AlertaVista[];
  onResolver: (id: string) => void;
  onCambiarPaciente: () => void;
}

/**
 * Alertas fijas sobre el formulario: paciente que no coincide (crítica, bloquea hasta resolverla) y las
 * alertas de la IA que no corresponden a un campo.
 */
export function AlertasConsulta({ alertas, onResolver, onCambiarPaciente }: Props) {
  const paciente = alertas.find((a) => a.tipo === "paciente_no_coincide" && !a.resuelta);
  const generales = alertas.filter((a) => a.campo === null && a.tipo !== "paciente_no_coincide" && !a.resuelta);
  if (!paciente && generales.length === 0) return null;
  return (
    <div className="sticky top-[calc(var(--alto-cabecera,48px)+8px)] z-20 grid gap-3">
      {paciente && (
        <Aviso
          id="campo-alerta-paciente"
          variante="critical"
          titulo={
            <span className="flex items-center gap-2">
              <UserX className="h-5 w-5" aria-hidden="true" />
              El paciente del audio no coincide
            </span>
          }
          acciones={
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onResolver(paciente.id)}>
                Es el paciente correcto
              </button>
              <button type="button" className="btn btn-critical-ghost btn-sm" onClick={onCambiarPaciente}>
                Cambiar paciente
              </button>
            </>
          }
        >
          {paciente.mensaje} No podrás autorizar hasta que lo confirmes.
        </Aviso>
      )}
      {generales.map((a) => (
        <Aviso
          key={a.id}
          variante={a.severidad === "critica" ? "critical" : a.severidad === "advertencia" ? "warning" : "info"}
          titulo={a.mensaje}
          acciones={
            a.bloquea ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onResolver(a.id)}>
                Marcar como revisada
              </button>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
