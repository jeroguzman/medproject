import { useEffect } from "react";

/** Título de la pestaña: identifica la pantalla y, si aplica, al paciente (DS 8.2). */
export function useTitulo(titulo: string | null | undefined) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · VozClínica` : "VozClínica";
  }, [titulo]);
}
