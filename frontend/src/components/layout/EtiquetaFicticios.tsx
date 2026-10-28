import { FlaskConical } from "lucide-react";

/** Etiqueta fija "Datos ficticios" (RNF-01). Al imprimir la reemplaza el pie de la nota, que dice lo mismo. */
export function EtiquetaFicticios() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-50 print:hidden">
      <span className="badge b-warning shadow-1">
        <FlaskConical aria-hidden="true" />
        Datos ficticios
      </span>
    </div>
  );
}
