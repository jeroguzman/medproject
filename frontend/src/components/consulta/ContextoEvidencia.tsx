import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DialogoReportarError } from "@/components/consulta/DialogoReportarError";

interface ContextoEvidencia {
  /** Citas del campo enfocado: se resaltan en la transcripción. */
  citasActivas: string[];
  enfocar: (citas: string[] | null) => void;
  /** "Ver en la transcripción": cambia a esa pestaña y desplaza el panel. */
  ver: (citas: string[]) => void;
  /** Cambia cada vez que se pide ver una cita. */
  solicitud: { n: number; citas: string[] };
  /** Referencias de apoyo (Tavily): abre la pestaña con el término. */
  verReferencias: (termino: string) => void;
  referencia: { n: number; termino: string };
  /** "Reportar error de la IA" (Linear) para un campo, por ejemplo "plan.medicamentos[0]". */
  reportar: (campo: string) => void;
}

const Contexto = createContext<ContextoEvidencia>({
  citasActivas: [],
  enfocar: () => undefined,
  ver: () => undefined,
  solicitud: { n: 0, citas: [] },
  verReferencias: () => undefined,
  referencia: { n: 0, termino: "" },
  reportar: () => undefined,
});

/** Estado compartido entre el formulario y el panel derecho: evidencia, referencias y reportes de la IA. */
export function ProveedorEvidencia({ children }: { children: ReactNode }) {
  const [citasActivas, setCitasActivas] = useState<string[]>([]);
  const [solicitud, setSolicitud] = useState({ n: 0, citas: [] as string[] });
  const [referencia, setReferencia] = useState({ n: 0, termino: "" });
  const [campoReporte, setCampoReporte] = useState<string | null>(null);
  const enfocar = useCallback((citas: string[] | null) => setCitasActivas(citas ?? []), []);
  const ver = useCallback((citas: string[]) => {
    setCitasActivas(citas);
    setSolicitud((s) => ({ n: s.n + 1, citas }));
  }, []);
  const verReferencias = useCallback((termino: string) => setReferencia((r) => ({ n: r.n + 1, termino })), []);
  const reportar = useCallback((campo: string) => setCampoReporte(campo), []);
  const valor = useMemo(
    () => ({ citasActivas, enfocar, ver, solicitud, verReferencias, referencia, reportar }),
    [citasActivas, enfocar, ver, solicitud, verReferencias, referencia, reportar],
  );
  return (
    <Contexto.Provider value={valor}>
      {children}
      <DialogoReportarError campo={campoReporte} onCerrar={() => setCampoReporte(null)} />
    </Contexto.Provider>
  );
}

export const useEvidencia = () => useContext(Contexto);
