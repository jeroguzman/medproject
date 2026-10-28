import { useQueryClient } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorApi, guardarToken, leerToken, mensajeDeError } from "@/api/cliente";
import { claves, iniciarSesion, iniciarAccesoSocial, solicitarCodigoMojoAuth, confirmarCodigoMojoAuth } from "@/api/consultas";
import { Aviso } from "@/components/ui/Aviso";
import { Logo } from "@/components/ui/Logo";
import { LogoProveedor, NOMBRE_PROVEEDOR } from "@/components/ui/LogoProveedor";
import { AUTH_PROVIDER, PROVEEDORES_SOCIALES, type ProveedorSocial, usaMock } from "@/config";
import { useTitulo } from "@/hooks/useTitulo";
import { guardarFlujoSocial } from "@/lib/accesoSocial";

/** Inicio de sesión (RF-01). Se puede pegar y usar gestores de contraseñas (DS §10). */
export default function Login() {
  useTitulo("Iniciar sesión");
  const navegar = useNavigate();
  const qc = useQueryClient();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const accesoMojo = AUTH_PROVIDER === "mojoauth" && !usaMock("auth");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? "/pacientes";

  // Al volver con "Atrás" desde Google o Facebook, el navegador puede restaurar la página con los botones deshabilitados.
  useEffect(() => {
    const restaurar = (e: PageTransitionEvent) => {
      if (e.persisted) setEnviando(false);
    };
    window.addEventListener("pageshow", restaurar);
    return () => window.removeEventListener("pageshow", restaurar);
  }, []);

  if (leerToken()) return <Navigate to={destino} replace />;

  const entrarCon = async (proveedor: ProveedorSocial) => {
    setError(null);
    setEnviando(true);
    try {
      const { flujo, url } = await iniciarAccesoSocial(proveedor);
      if (!guardarFlujoSocial(flujo, destino)) {
        setError("Tu navegador bloqueó el almacenamiento de esta pestaña. Usa el acceso con código o permite el almacenamiento.");
        setEnviando(false);
        return;
      }
      // Se queda en "Procesando…" mientras el navegador va a MojoAuth.
      window.location.assign(url);
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (accesoMojo ? (!email.trim() || (challenge !== null && !otp.trim())) : (!usuario.trim() || !contrasena)) {
      setError(accesoMojo ? "Escribe tu correo y, si ya lo solicitaste, el código recibido." : "Escribe tu usuario y tu contraseña.");
      return;
    }
    setEnviando(true);
    try {
      if (accesoMojo && challenge === null) {
        const respuesta = await solicitarCodigoMojoAuth(email.trim());
        setChallenge(respuesta.challenge_id);
        setAviso(respuesta.message);
        return;
      }
      const r = accesoMojo
        ? await confirmarCodigoMojoAuth(challenge!, otp)
        : await iniciarSesion(usuario.trim(), contrasena);
      guardarToken(r.access);
      qc.setQueryData(claves.medico, r.medico);
      navegar(destino, { replace: true });
    } catch (err) {
      setError(!accesoMojo && err instanceof ErrorApi && err.status === 401 ? "Usuario o contraseña incorrectos." : mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-4">
      <div className="card w-full max-w-sm p-8 shadow-2">
        <div className="mb-6 grid gap-3">
          <h1 className="flex">
            <Logo className="h-12" />
          </h1>
          <p className="t-body-sm text-texto-muted">Menos tiempo escribiendo, más tiempo atendiendo.</p>
        </div>
        {parametros.get("sesion") === "expirada" && !error && (
          <Aviso variante="info" titulo="Tu sesión terminó" className="mb-4">
            Vuelve a iniciar sesión. Tu borrador sigue guardado en este equipo.
          </Aviso>
        )}
        {accesoMojo && PROVEEDORES_SOCIALES.length > 0 && challenge === null && (
          <div className="mb-4 grid gap-2">
            {PROVEEDORES_SOCIALES.map((proveedor) => (
              <button key={proveedor} type="button" className="btn btn-secondary btn-block" disabled={enviando}
                onClick={() => entrarCon(proveedor)}>
                <LogoProveedor proveedor={proveedor} />
                Continuar con {NOMBRE_PROVEEDOR[proveedor]}
              </button>
            ))}
            <p className="t-body-sm mt-2 text-center text-texto-muted">o recibe un código en tu correo</p>
          </div>
        )}
        <form className="grid gap-4" onSubmit={enviar} noValidate>
          {accesoMojo ? (
            <>
              <div className="field">
                <label className="field-label" htmlFor="email">Correo autorizado</label>
                <input id="email" name="email" type="email" className="input" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={challenge !== null || enviando} required />
              </div>
              {aviso && <Aviso variante="info" titulo="Revisa tu correo">{aviso}</Aviso>}
              {challenge && (
                <div className="field">
                  <label className="field-label" htmlFor="otp">Código de acceso</label>
                  <input id="otp" name="otp" className="input" inputMode="numeric" autoComplete="one-time-code"
                    value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={10} required autoFocus />
                  <p className="help">El código vence en 5 minutos. No lo compartas.</p>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={enviando}
                    onClick={() => { setChallenge(null); setOtp(""); setAviso(null); setError(null); }}>
                    Cambiar correo o solicitar otro código
                  </button>
                </div>
              )}
            </>
          ) : (
          <>
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
          </>
          )}
          {error && (
            <Aviso variante="critical" titulo="No pudiste entrar">
              {error}
            </Aviso>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            <LogIn className="h-5 w-5" aria-hidden="true" />
            {enviando ? "Procesando…" : accesoMojo && !challenge ? "Enviar código" : "Iniciar sesión"}
          </button>
        </form>
        {usaMock("auth") && (
          <p className="t-body-sm mt-6 text-texto-muted">
            Modo de datos de ejemplo: usuario <span className="mono">pmendez</span> o <span className="mono">esalas</span>, contraseña{" "}
            <span className="mono">demo1234</span>.
          </p>
        )}
      </div>
    </main>
  );
}
