import { useEffect } from "react";

/** Aviso del navegador al cerrar o recargar la pestaña mientras hay trabajo sin autorizar (prompt 6). */
export function useAvisoAlSalir(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [activo]);
}
