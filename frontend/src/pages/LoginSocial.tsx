import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { guardarToken, mensajeDeError } from "@/api/cliente";
import { claves, confirmarAccesoSocial } from "@/api/consultas";
import { Aviso } from "@/components/ui/Aviso";
import { useTitulo } from "@/hooks/useTitulo";
import { tomarFlujoSocial } from "@/lib/accesoSocial";

/** Regreso de MojoAuth después de Google o Facebook (?state_id=…). Django confirma el acceso. */
export default function LoginSocial() {
  useTitulo("Iniciando sesión");
  const navegar = useNavigate();
  const qc = useQueryClient();
  const { search } = useLocation();
  const [error, setError] = useState<string | null>(null);
  const iniciado = useRef(false);

  useEffect(() => {
    // En desarrollo StrictMode repite los efectos; el flujo solo se puede usar una vez.
    if (iniciado.current) return;
    iniciado.current = true;
    const stateId = new URLSearchParams(search).get("state_id");
    const flujo = tomarFlujoSocial();
    // El state_id no se queda en la barra de direcciones ni en el historial.
    navegar("/login/social", { replace: true });
    if (!stateId || !flujo) {
      setError("El inicio de sesión no se completó en esta pestaña o ya se usó. Vuelve a intentarlo.");
      return;
    }
    confirmarAccesoSocial(flujo.flujo, stateId)
      .then((r) => {
        guardarToken(r.access);
        qc.setQueryData(claves.medico, r.medico);
        navegar(flujo.destino, { replace: true });
      })
      .catch((err) => setError(mensajeDeError(err)));
  }, [navegar, qc, search]);

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-4">
      <div className="card w-full max-w-sm p-8 shadow-2">
        {error ? (
          <Aviso
            variante="critical"
            titulo="No pudiste entrar"
            acciones={
              <Link to="/login" replace className="btn btn-secondary btn-sm">
                Volver a iniciar sesión
              </Link>
            }
          >
            {error}
          </Aviso>
        ) : (
          <p className="t-body text-texto-muted" role="status">
            Confirmando tu acceso…
          </p>
        )}
      </div>
    </main>
  );
}
