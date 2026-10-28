import { FlaskConical } from "lucide-react";
import { USAR_MOCKS, usaMock } from "@/config";

/** Etiqueta fija "Datos ficticios" (RNF-01). Al imprimir la reemplaza el pie de la nota, que dice lo mismo. */
export function EtiquetaFicticios() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-50 print:hidden">
      <span className="badge b-warning shadow-1">
        <FlaskConical aria-hidden="true" />
        Datos ficticios
      </span>
      {USAR_MOCKS && (
        <p role="status" className="mt-1 max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-xs text-texto shadow-1">
          {usaMock("auth") && usaMock("pacientes") && usaMock("notas")
            ? "Demo simulada · los cambios se guardan solo en este navegador."
            : "Demo con algunos servicios simulados."}
        </p>
      )}
    </div>
  );
}
