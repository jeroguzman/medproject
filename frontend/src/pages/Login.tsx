import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Stethoscope } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorApi, guardarToken, leerToken, mensajeDeError } from "@/api/cliente";
import { claves, iniciarSesion } from "@/api/consultas";
import { Aviso } from "@/components/ui/Aviso";
import { USAR_MOCKS } from "@/config";
import { useTitulo } from "@/hooks/useTitulo";

/** Inicio de sesión (RF-01). Se puede pegar y usar gestores de contraseñas (DS §10). */
export default function Login() {
  useTitulo("Iniciar sesión");
  const navegar = useNavigate();
  const qc = useQueryClient();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? "/pacientes";

  if (leerToken()) return <Navigate to={destino} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!usuario.trim() || !contrasena) {
      setError("Escribe tu usuario y tu contraseña.");
      return;
    }
    setEnviando(true);
    try {
      const r = await iniciarSesion(usuario.trim(), contrasena);
      guardarToken(r.access);
      qc.setQueryData(claves.medico, r.medico);
      navegar(destino, { replace: true });
    } catch (err) {
      setError(err instanceof ErrorApi && err.status === 401 ? "Usuario o contraseña incorrectos." : mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-4">
      <div className="card w-full max-w-sm p-8 shadow-2">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-banner-bg text-banner-fg">
            <Stethoscope className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="t-title-lg">VozClínica</h1>
            <p className="t-body-sm text-texto-muted">Menos tiempo escribiendo, más tiempo atendiendo.</p>
          </div>
        </div>
        {parametros.get("sesion") === "expirada" && !error && (
          <Aviso variante="info" titulo="Tu sesión terminó" className="mb-4">
            Vuelve a iniciar sesión. Tu borrador sigue guardado en este equipo.
          </Aviso>
        )}
        <form className="grid gap-4" onSubmit={enviar} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="usuario">
              Usuario
            </label>
            <input
              id="usuario"
              name="username"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="contrasena">
              Contraseña
            </label>
            <input
              id="contrasena"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>
          {error && (
            <Aviso variante="critical" titulo="No pudiste entrar">
              {error}
            </Aviso>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            <LogIn className="h-5 w-5" aria-hidden="true" />
            {enviando ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        {USAR_MOCKS && (
          <p className="t-body-sm mt-6 text-texto-muted">
            Modo de datos de ejemplo: usuario <span className="mono">pmendez</span> o <span className="mono">esalas</span>, contraseña{" "}
            <span className="mono">demo1234</span>.
          </p>
        )}
      </div>
    </main>
  );
}
