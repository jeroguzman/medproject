import { Search, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mensajeDeError } from "@/api/cliente";
import { usePacientes } from "@/api/consultas";
import { RegistrarPaciente } from "@/components/paciente/RegistrarPaciente";
import { Aviso } from "@/components/ui/Aviso";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Vacio } from "@/components/ui/Vacio";
import { useTitulo } from "@/hooks/useTitulo";
import { existeBorrador } from "@/lib/borrador";
import { formatearEdad, formatearFecha, nombreCabecera, textoSexo } from "@/lib/formatos";

/** Lista y búsqueda de pacientes (RF-03) y registro mínimo (RF-04). */
export default function Pacientes() {
  useTitulo("Pacientes");
  const navegar = useNavigate();
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const { data: pacientes, isLoading, isError, error, isFetching } = usePacientes(q);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(texto.trim()), 250);
    return () => window.clearTimeout(t);
  }, [texto]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-title-lg">Pacientes</h1>
          <p className="t-body-sm text-texto-muted">Busca por nombre, expediente o fecha de nacimiento.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setRegistrando(true)}>
          <UserPlus className="h-5 w-5" aria-hidden="true" />
          Registrar paciente
        </button>
      </div>

      <div className="field max-w-xl">
        <label htmlFor="buscar" className="sr-only">
          Buscar paciente
        </label>
        <div className="input-wrap">
          <span className="lead-ic">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            id="buscar"
            type="search"
            className="input"
            placeholder="GARCÍA, 0004-8217 o 12/03/1992"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      {isError ? (
        <Aviso variante="critical" titulo="No se pudo cargar la lista">
          {mensajeDeError(error)}
        </Aviso>
      ) : isLoading ? (
        <div className="card">
          <Esqueleto etiqueta="Cargando pacientes" lineas={6} />
        </div>
      ) : pacientes && pacientes.length > 0 ? (
        <div className="overflow-x-auto" aria-busy={isFetching}>
          <table className="dtable">
            <caption className="sr-only">Pacientes{q ? ` que coinciden con «${q}»` : ""}</caption>
            <thead>
              <tr>
                <th scope="col">Paciente</th>
                <th scope="col">Sexo</th>
                <th scope="col">Edad</th>
                <th scope="col">Expediente</th>
                <th scope="col">Última consulta</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id} onClick={() => navegar(`/pacientes/${p.id}`)}>
                  <td>
                    <a
                      href={`/pacientes/${p.id}`}
                      className="font-semibold text-texto no-underline hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        navegar(`/pacientes/${p.id}`);
                      }}
                    >
                      {nombreCabecera(p)}
                    </a>
                    {existeBorrador(p.id) && <span className="badge b-draft ml-2">Borrador</span>}
                  </td>
                  <td>{textoSexo(p.sexo)}</td>
                  <td className="tnum">{formatearEdad(p.fecha_nacimiento, undefined, true)}</td>
                  <td className="mono">{p.numero_expediente}</td>
                  <td className="tnum">{formatearFecha(p.ultima_consulta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Vacio
          icono={Users}
          titulo={q ? "Ningún paciente coincide" : "Aún no hay pacientes"}
          accion={
            <button type="button" className="btn btn-secondary" onClick={() => setRegistrando(true)}>
              Registrar paciente
            </button>
          }
        >
          {q ? `No encontramos «${q}». Revisa la escritura o registra al paciente.` : "Registra al primero para iniciar su consulta."}
        </Vacio>
      )}

      <RegistrarPaciente abierto={registrando} onCerrar={() => setRegistrando(false)} />
    </div>
  );
}
