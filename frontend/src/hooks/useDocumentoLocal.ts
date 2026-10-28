import { useCallback, useEffect, useRef, useState } from "react";
import { LIMITES } from "@/config";
import { borrarLocal, EVENTO_DESCARTAR_TODO, guardarLocal } from "@/lib/borrador";

export type EstadoGuardado = "sin_cambios" | "pendiente" | "guardado" | "error";

interface Opciones<T> {
  /** Clave de localStorage ("medvox:borrador:<id>" o "medvox:correccion:<id>"). */
  clave: string;
  /** false mientras faltan los datos para crear el documento (por ejemplo, el paciente). */
  listo: boolean;
  leer: () => T | null;
  crear: () => T;
}

/**
 * Documento de trabajo que vive solo en localStorage: se guarda 500 ms después de cada cambio y
 * se vuelve a cargar al abrir la pantalla (prompt 6). Nada de esto sale del navegador.
 */
export function useDocumentoLocal<T extends { actualizado_en: string }>({ clave, listo, leer, crear }: Opciones<T>) {
  const [doc, setDoc] = useState<T | null>(null);
  const [estado, setEstado] = useState<EstadoGuardado>("sin_cambios");
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  const [existeEnEquipo, setExisteEnEquipo] = useState(false);
  const docRef = useRef<T | null>(null);
  const timer = useRef<number | null>(null);
  // Tras autorizar o descartar todo, la pantalla ya no debe volver a escribir.
  const cerrado = useRef(false);
  const fns = useRef({ leer, crear });
  fns.current = { leer, crear };

  useEffect(() => {
    if (!listo) return;
    const guardado = fns.current.leer();
    const inicial = guardado ?? fns.current.crear();
    docRef.current = inicial;
    cerrado.current = false;
    setDoc(inicial);
    setExisteEnEquipo(guardado !== null);
    setGuardadoEn(guardado ? new Date(guardado.actualizado_en) : null);
    setEstado(guardado ? "guardado" : "sin_cambios");
  }, [clave, listo]);

  const guardar = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (cerrado.current || !docRef.current) return;
    const ok = guardarLocal(clave, docRef.current);
    setEstado(ok ? "guardado" : "error");
    if (ok) {
      setGuardadoEn(new Date());
      setExisteEnEquipo(true);
    }
  }, [clave]);

  const actualizar = useCallback(
    (cambio: (actual: T) => T) => {
      const actual = docRef.current;
      if (!actual) return;
      const siguiente = { ...cambio(actual), actualizado_en: new Date().toISOString() };
      docRef.current = siguiente;
      cerrado.current = false;
      setDoc(siguiente);
      setEstado("pendiente");
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(guardar, LIMITES.guardadoBorradorMs);
    },
    [guardar],
  );

  /** Borra el documento del equipo y empieza uno nuevo (Descartar borrador). */
  const descartar = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    borrarLocal(clave);
    const nuevo = fns.current.crear();
    docRef.current = nuevo;
    setDoc(nuevo);
    setExisteEnEquipo(false);
    setGuardadoEn(null);
    setEstado("sin_cambios");
  }, [clave]);

  /** Borra el documento y deja de guardar (después de autorizar). */
  const cerrar = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    cerrado.current = true;
    borrarLocal(clave);
    setExisteEnEquipo(false);
    setEstado("sin_cambios");
  }, [clave]);

  // Guarda lo pendiente al salir de la pantalla o al ocultar la pestaña.
  useEffect(() => {
    const alOcultar = () => {
      if (timer.current !== null) guardar();
    };
    const alDescartarTodo = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      cerrado.current = true;
    };
    window.addEventListener("pagehide", alOcultar);
    window.addEventListener(EVENTO_DESCARTAR_TODO, alDescartarTodo);
    return () => {
      window.removeEventListener("pagehide", alOcultar);
      window.removeEventListener(EVENTO_DESCARTAR_TODO, alDescartarTodo);
      alOcultar();
    };
  }, [guardar]);

  return { doc, actualizar, descartar, cerrar, guardarYa: guardar, estado, guardadoEn, existeEnEquipo: existeEnEquipo || estado === "pendiente" };
}
