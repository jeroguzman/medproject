import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pedir } from "@/api/cliente";
import { usaMock } from "@/config";

type Entrada = { id: number; clave: string; nombre: string; presentacion: string; fuente_documento?: string; documento?: string; extraido_en?: string };
type Respuesta = {
  catalogo: null | { id: string; fuente: string; documento: string; extraido_en: string };
  resultados: Entrada[];
};

/** Optional reference search: editing the prescription never depends on this request. */
export function BuscarMedicamento({ termino, onSeleccionar }: { termino: string; onSeleccionar: (nombre: string) => void }) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState<Entrada | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setBusqueda(termino.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [termino]);
  const habilitado = !usaMock("catalogo") && busqueda.length >= 2 && busqueda.length <= 100;
  const consulta = useQuery({
    queryKey: ["catalogo-imss", busqueda],
    queryFn: () => pedir<Respuesta>(`/api/catalogo/medicamentos?q=${encodeURIComponent(busqueda)}`),
    enabled: habilitado,
    retry: false,
    staleTime: 60_000,
  });
  if (usaMock("catalogo") || termino.trim().length < 2 || termino.trim() !== busqueda) return null;
  if (termino.trim().length > 100) return <p className="t-caption">Puedes continuar con captura manual.</p>;
  if (consulta.isPending) return <p role="status" className="t-caption">Buscando en el catálogo IMSS…</p>;
  if (consulta.isError) return <p role="status" className="t-caption">Catálogo no disponible. Puedes continuar con captura manual.</p>;
  const datos = consulta.data;
  if (!datos?.catalogo) return <p className="t-caption">Catálogo IMSS pendiente de publicación. Captura manual disponible.</p>;
  const catalogo = datos.catalogo;
  const elegida = seleccion?.nombre === termino ? seleccion : null;
  return (
    <div className="grid gap-2">
      <p className="t-caption text-texto-muted">
        <a href={catalogo.fuente} target="_blank" rel="noreferrer" className="underline">Fuente IMSS</a>
        {" · "}{catalogo.documento}{" · Extraído: "}{new Date(catalogo.extraido_en).toLocaleDateString("es-MX")}
      </p>
      {elegida ? (
        <p className="t-caption">{elegida.clave && `Clave IMSS: ${elegida.clave}. `}{elegida.presentacion}
          {elegida.fuente_documento && <a className="underline block" href={elegida.fuente_documento} target="_blank" rel="noreferrer">{elegida.documento || "Documento del medicamento"}{elegida.extraido_en && ` · Extraído: ${new Date(elegida.extraido_en).toLocaleDateString("es-MX")}`}</a>}
        </p>
      ) : datos.resultados.length ? (
        <ul aria-label="Resultados del catálogo IMSS" className="grid gap-1">
          {datos.resultados.map((entrada) => (
            <li key={entrada.id}>
              <button type="button" className="w-full rounded border border-border p-2 text-left hover:bg-surface" onClick={() => {
                setSeleccion(entrada);
                onSeleccionar(entrada.nombre);
              }}>
                <span className="t-label">{entrada.nombre}</span>
                {entrada.documento && <span className="t-caption block">{entrada.documento}</span>}
                <span className="t-caption block">{entrada.clave && `Clave IMSS: ${entrada.clave} · `}{entrada.presentacion}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="t-caption">Sin coincidencias en este catálogo. Puedes escribir el medicamento manualmente.</p>}
      <p className="t-caption text-texto-muted">Referencia del IMSS. Revisa presentación, dosis, vía y duración antes de autorizar.</p>
    </div>
  );
}
