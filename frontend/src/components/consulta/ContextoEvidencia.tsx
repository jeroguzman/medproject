import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ContextoEvidencia {
  /** Citas del campo enfocado: se resaltan en la transcripción. */
  citasActivas: string[];
  enfocar: (citas: string[] | null) => void;
  /** "Ver en la transcripción": cambia a esa pestaña y desplaza el panel. */
  ver: (citas: string[]) => void;
  /** Cambia cada vez que se pide ver una cita. */
  solicitud: { n: number; citas: string[] };
}

const Contexto = createContext<ContextoEvidencia>({
  citasActivas: [],
  enfocar: () => undefined,
  ver: () => undefined,
  solicitud: { n: 0, citas: [] },
});

export function ProveedorEvidencia({ children }: { children: ReactNode }) {
  const [citasActivas, setCitasActivas] = useState<string[]>([]);
  const [solicitud, setSolicitud] = useState({ n: 0, citas: [] as string[] });
  const enfocar = useCallback((citas: string[] | null) => setCitasActivas(citas ?? []), []);
  const ver = useCallback((citas: string[]) => {
    setCitasActivas(citas);
    setSolicitud((s) => ({ n: s.n + 1, citas }));
  }, []);
  const valor = useMemo(() => ({ citasActivas, enfocar, ver, solicitud }), [citasActivas, enfocar, ver, solicitud]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useEvidencia = () => useContext(Contexto);
