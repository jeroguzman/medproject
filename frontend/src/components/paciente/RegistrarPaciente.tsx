import { CircleAlert, UserPlus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { mensajeDeError } from "@/api/cliente";
import { useCoincidencias, useRegistrarPaciente } from "@/api/consultas";
import type { Paciente, Sexo } from "@/api/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { CampoFecha } from "@/components/ui/CampoFecha";
import { Dialogo } from "@/components/ui/Dialogo";
import { Segmentado } from "@/components/ui/Segmentado";
import { ahoraEnMexico, formatearEdad, formatearFecha, nombreCabecera, normalizarTexto, textoSexo } from "@/lib/formatos";
import { cn } from "@/lib/utils";

interface Formulario {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  sexo: Sexo | null;
  alergias: string;
  telefono: string;
}

const VACIO: Formulario = {
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  fecha_nacimiento: "",
  sexo: null,
  alergias: "",
  telefono: "",
};

const ETIQUETAS: Record<string, string> = {
  nombres: "Nombre(s)",
  apellido_paterno: "Apellido paterno",
  fecha_nacimiento: "Fecha de nacimiento",
  sexo: "Sexo",
  alergias: "Alergias",
};

/** Registro mínimo con búsqueda de duplicados antes de crear (RF-04, DS 7.7). */
export function RegistrarPaciente({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const navegar = useNavigate();
  const registrar = useRegistrarPaciente();
  const [f, setF] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<string[]>([]);
  const [descartadas, setDescartadas] = useState<Set<number>>(new Set());

  const porApellido = useCoincidencias(f.apellido_paterno.trim());
  const porFecha = useCoincidencias(f.fecha_nacimiento);

  const coincidencias = useMemo(() => {
    const nombre = normalizarTexto(f.nombres).split(" ")[0] ?? "";
    const lista = new Map<number, Paciente>();
    for (const p of porApellido.data ?? []) {
      if (normalizarTexto(p.apellido_paterno) !== normalizarTexto(f.apellido_paterno)) continue;
      if (nombre.length >= 2 && !normalizarTexto(p.nombres).startsWith(nombre)) continue;
      lista.set(p.id, p);
    }
    for (const p of porFecha.data ?? []) if (p.fecha_nacimiento === f.fecha_nacimiento) lista.set(p.id, p);
    return [...lista.values()].filter((p) => !descartadas.has(p.id));
  }, [porApellido.data, porFecha.data, f.nombres, f.apellido_paterno, f.fecha_nacimiento, descartadas]);

  const cambiar = <K extends keyof Formulario>(clave: K, valor: Formulario[K]) => {
    setF((actual) => ({ ...actual, [clave]: valor }));
    setErrores((e) => e.filter((x) => x !== clave));
  };

  const cerrar = () => {
    setF(VACIO);
    setErrores([]);
    setDescartadas(new Set());
    registrar.reset();
    onCerrar();
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (coincidencias.length > 0) return;
    const faltan = (["nombres", "apellido_paterno", "fecha_nacimiento", "sexo", "alergias"] as const).filter((k) => !String(f[k] ?? "").trim());
    setErrores(faltan);
    if (faltan.length) {
      document.getElementById(`reg-${faltan[0]}`)?.focus();
      return;
    }
    try {
      const paciente = await registrar.mutateAsync({
        nombres: f.nombres.trim(),
        apellido_paterno: f.apellido_paterno.trim(),
        apellido_materno: f.apellido_materno.trim() || undefined,
        fecha_nacimiento: f.fecha_nacimiento,
        sexo: f.sexo!,
        alergias: f.alergias.trim(),
        telefono: f.telefono.trim() || undefined,
      });
      toast.success(`Paciente registrado · Exp. ${paciente.numero_expediente}`);
      cerrar();
      navegar(`/pacientes/${paciente.id}`);
    } catch {
      // El error se muestra abajo.
    }
  };

  const conError = (clave: string) => errores.includes(clave);
  const mensajeFalta = (clave: string) =>
    conError(clave) ? (
      <p className="msg msg-error">
        <CircleAlert aria-hidden="true" />
        Escribe {ETIQUETAS[clave].toLowerCase()}.
      </p>
    ) : null;

  return (
    <Dialogo
      abierto={abierto}
      onCerrar={cerrar}
      grande
      rol="dialog"
      titulo="Registrar paciente"
      acciones={
        <>
          <button type="button" className="btn btn-secondary" onClick={cerrar}>
            Cancelar
          </button>
          <button
            type="submit"
            form="form-registro"
            className="btn btn-primary"
            aria-disabled={coincidencias.length > 0 || registrar.isPending}
          >
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            {registrar.isPending ? "Registrando…" : "Registrar paciente"}
          </button>
        </>
      }
    >
      <form id="form-registro" className="mt-4 grid gap-5" onSubmit={enviar} noValidate>
        <p className="t-body-sm">Lo mínimo para abrir el expediente. El número de expediente lo asigna el sistema.</p>

        {coincidencias.length > 0 && (
          <Aviso
            variante="warning"
            titulo="Posible paciente ya registrado"
            acciones={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDescartadas((d) => new Set([...d, ...coincidencias.map((p) => p.id)]))}
              >
                No es ninguno: registrar nuevo
              </button>
            }
          >
            <ul className="grid gap-2">
              {coincidencias.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="tnum">
                    <b>{nombreCabecera(p)}</b> · {textoSexo(p.sexo)} · {formatearEdad(p.fecha_nacimiento)} · {formatearFecha(p.fecha_nacimiento)} · Exp.{" "}
                    <span className="mono">{p.numero_expediente}</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      cerrar();
                      navegar(`/pacientes/${p.id}`);
                    }}
                  >
                    Abrir expediente
                  </button>
                </li>
              ))}
            </ul>
          </Aviso>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div className={cn("field", conError("nombres") && "is-error")}>
            <label className="field-label" htmlFor="reg-nombres">
              Nombre(s)<span className="req" aria-hidden="true">*</span>
            </label>
            <input id="reg-nombres" className="input" autoComplete="off" value={f.nombres} onChange={(e) => cambiar("nombres", e.target.value)} required />
            {mensajeFalta("nombres")}
          </div>
          <div className={cn("field", conError("apellido_paterno") && "is-error")}>
            <label className="field-label" htmlFor="reg-apellido_paterno">
              Apellido paterno<span className="req" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-apellido_paterno"
              className="input"
              autoComplete="off"
              value={f.apellido_paterno}
              onChange={(e) => cambiar("apellido_paterno", e.target.value)}
              required
            />
            {mensajeFalta("apellido_paterno")}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="reg-apellido_materno">
              Apellido materno <span className="field-opt">opcional</span>
            </label>
            <input
              id="reg-apellido_materno"
              className="input"
              autoComplete="off"
              value={f.apellido_materno}
              onChange={(e) => cambiar("apellido_materno", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <CampoFecha
              id="reg-fecha_nacimiento"
              etiqueta="Fecha de nacimiento"
              obligatorio
              mostrarEdad
              maxima={ahoraEnMexico().fecha}
              valor={f.fecha_nacimiento}
              onCambio={(iso) => cambiar("fecha_nacimiento", iso)}
            />
            {mensajeFalta("fecha_nacimiento")}
          </div>
          <div className={cn(conError("sexo") && "is-error")}>
            <Segmentado
              id="reg-sexo"
              etiqueta="Sexo *"
              opciones={[
                { valor: "mujer", etiqueta: "Mujer" },
                { valor: "hombre", etiqueta: "Hombre" },
                { valor: "no_especificado", etiqueta: "No especificado" },
              ]}
              valor={f.sexo}
              onCambio={(v) => cambiar("sexo", v)}
            />
            {mensajeFalta("sexo")}
          </div>
        </div>

        <div className={cn("field", conError("alergias") && "is-error")}>
          <label className="field-label" htmlFor="reg-alergias">
            Alergias<span className="req" aria-hidden="true">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="reg-alergias"
              className="input min-w-[240px] flex-1"
              autoComplete="off"
              placeholder="Medicamento o sustancia y reacción"
              value={f.alergias}
              onChange={(e) => cambiar("alergias", e.target.value)}
              aria-describedby="reg-alergias-ayuda"
              required
            />
            <button type="button" className="btn btn-secondary" onClick={() => cambiar("alergias", "Sin alergias conocidas")}>
              Sin alergias conocidas
            </button>
          </div>
          <p id="reg-alergias-ayuda" className="help">
            «Sin alergias conocidas» se escribe explícito: un campo vacío no significa que no tenga alergias.
          </p>
          {mensajeFalta("alergias")}
        </div>

        <div className="field max-w-xs">
          <label className="field-label" htmlFor="reg-telefono">
            Teléfono <span className="field-opt">opcional</span>
          </label>
          <input
            id="reg-telefono"
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={f.telefono}
            onChange={(e) => cambiar("telefono", e.target.value)}
          />
        </div>

        {coincidencias.length > 0 && (
          <p className="help">Revisa las coincidencias: abre el expediente o confirma que es alguien nuevo.</p>
        )}
        {registrar.isError && (
          <Aviso variante="critical" titulo="No se pudo registrar">
            {mensajeDeError(registrar.error)}
          </Aviso>
        )}
      </form>
    </Dialogo>
  );
}
