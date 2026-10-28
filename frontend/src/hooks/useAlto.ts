import { useEffect, useState } from "react";

/**
 * Mide la altura de un elemento (por ejemplo, la cabecera fija) y la actualiza al cambiar.
 * Devuelve una ref de función, así funciona aunque el elemento aparezca después de cargar los datos.
 */
export function useAlto<T extends HTMLElement>() {
  const [elemento, setElemento] = useState<T | null>(null);
  const [alto, setAlto] = useState(0);
  useEffect(() => {
    if (!elemento) return;
    const observador = new ResizeObserver(() => setAlto(elemento.getBoundingClientRect().height));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [elemento]);
  return [setElemento, alto] as const;
}
