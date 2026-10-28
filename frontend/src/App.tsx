import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorApi } from "@/api/cliente";
import { AppLayout } from "@/components/layout/AppLayout";
import { EtiquetaFicticios } from "@/components/layout/EtiquetaFicticios";
import { RutaProtegida } from "@/components/layout/RutaProtegida";
import Consulta from "@/pages/Consulta";
import Expediente from "@/pages/Expediente";
import Login from "@/pages/Login";
import NoEncontrada from "@/pages/NoEncontrada";
import NotaCorregir from "@/pages/NotaCorregir";
import NotaImprimir from "@/pages/NotaImprimir";
import NotaVer from "@/pages/NotaVer";
import Pacientes from "@/pages/Pacientes";

const clienteQuery = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // No se reintenta lo que no va a cambiar (sesión vencida, no existe, datos inválidos).
      retry: (intentos, error) => !(error instanceof ErrorApi && error.status >= 400 && error.status < 500) && intentos < 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={clienteQuery}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RutaProtegida />}>
            <Route path="/notas/:id/imprimir" element={<NotaImprimir />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/pacientes" replace />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:id" element={<Expediente />} />
              <Route path="/pacientes/:id/consulta" element={<Consulta />} />
              <Route path="/notas/:id" element={<NotaVer />} />
              <Route path="/notas/:id/corregir" element={<NotaCorregir />} />
              <Route path="*" element={<NoEncontrada />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <EtiquetaFicticios />
      <Toaster position="bottom-center" theme="system" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)", fontSize: "0.9375rem" } }} />
    </QueryClientProvider>
  );
}
