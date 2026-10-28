import { Navigate, Outlet, useLocation } from "react-router-dom";
import { leerToken } from "@/api/cliente";

/** Sin token, lleva a /login y recuerda a dónde quería ir el médico. */
export function RutaProtegida() {
  const ubicacion = useLocation();
  if (!leerToken()) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  return <Outlet />;
}
