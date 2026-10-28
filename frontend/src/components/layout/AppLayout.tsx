import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Stethoscope, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import { borrarToken } from "@/api/cliente";
import { useMedico } from "@/api/consultas";
import { Dialogo } from "@/components/ui/Dialogo";
import { descartarTodoElTrabajo, hayTrabajoSinAutorizar } from "@/lib/borrador";
import { cn } from "@/lib/utils";

/** Layout autenticado: barra superior de 48 px y navegación lateral (riel de 88 px en la consulta). */
export function AppLayout() {
  const navegar = useNavigate();
  const qc = useQueryClient();
  const { data: medico } = useMedico();
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const enConsulta = useMatch("/pacientes/:id/consulta");
  const enCorreccion = useMatch("/notas/:id/corregir");
  const riel = !!(enConsulta || enCorreccion);
  const { pathname } = useLocation();

  // Cada pantalla empieza arriba, aunque la anterior se haya quedado abajo.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const salir = () => {
    borrarToken();
    qc.clear();
    navegar("/login", { replace: true });
  };

  const pedirSalida = () => {
    if (hayTrabajoSinAutorizar()) setConfirmarSalida(true);
    else salir();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60]"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b border-border bg-surface px-4">
        <NavLink to="/pacientes" className="flex items-center gap-2 text-texto no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-banner-bg text-banner-fg">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="t-title-sm">VozClínica</span>
        </NavLink>
        <div className="ml-auto flex items-center gap-3">
          {medico && (
            <span className="t-body-sm text-texto-muted">
              <span className="font-semibold text-texto">{medico.nombre_completo}</span>
              <span className="hidden md:inline"> · Céd. <span className="mono">{medico.cedula_profesional}</span></span>
            </span>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={pedirSalida}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Navegación principal"
          className={cn(
            "sticky top-12 hidden h-[calc(100vh-48px)] shrink-0 border-r border-border bg-surface p-2 md:block",
            riel ? "w-[88px]" : "w-52",
          )}
        >
          <NavLink
            to="/pacientes"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 font-semibold no-underline text-texto-muted hover:bg-surface-hover hover:text-texto",
                riel && "flex-col gap-1 px-1 py-2 text-center t-caption font-semibold",
                isActive && "bg-accion-subtle text-accion-texto hover:bg-accion-subtle hover:text-accion-texto",
              )
            }
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            Pacientes
          </NavLink>
        </nav>
        <main id="contenido" className="min-w-0 flex-1" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <Dialogo
        abierto={confirmarSalida}
        onCerrar={() => setConfirmarSalida(false)}
        titulo="¿Cerrar sesión?"
        acciones={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmarSalida(false)}>
              Seguir trabajando
            </button>
            <button
              type="button"
              className="btn btn-critical"
              onClick={() => {
                descartarTodoElTrabajo();
                setConfirmarSalida(false);
                salir();
              }}
            >
              Descartar y salir
            </button>
          </>
        }
      >
        Tienes un borrador sin autorizar. Si cierras sesión se pierde.
      </Dialogo>
    </div>
  );
}
