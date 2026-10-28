import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  abierto: boolean;
  /** Se llama con Esc o al pulsar fuera. Esc nunca descarta lo capturado (DS 8.1). */
  onCerrar: () => void;
  /** El título es la pregunta y el cuerpo, la consecuencia (DS 6.7). */
  titulo: ReactNode;
  children?: ReactNode;
  acciones: ReactNode;
  grande?: boolean;
  /** "alertdialog" para confirmaciones. */
  rol?: "dialog" | "alertdialog";
}

/** Diálogo modal con el elemento <dialog> nativo: atrapa el foco, cierra con Esc y lo devuelve al cerrar. */
export function Dialogo({ abierto, onCerrar, titulo, children, acciones, grande, rol = "alertdialog" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idCuerpo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      role={rol}
      aria-labelledby={idTitulo}
      aria-describedby={children && rol === "alertdialog" ? idCuerpo : undefined}
      className={cn("dlg", grande && "dlg-lg")}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
    >
      {abierto && (
        <>
          <h2 id={idTitulo}>{titulo}</h2>
          {children && (
            <div id={idCuerpo} className={rol === "alertdialog" ? "t-body text-texto-muted" : undefined}>
              {children}
            </div>
          )}
          <div className="dlg-actions">{acciones}</div>
        </>
      )}
    </dialog>
  );
}
