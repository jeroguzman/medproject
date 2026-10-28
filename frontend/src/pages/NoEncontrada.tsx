import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { Vacio } from "@/components/ui/Vacio";
import { useTitulo } from "@/hooks/useTitulo";

export default function NoEncontrada() {
  useTitulo("Página no encontrada");
  return (
    <div className="mx-auto max-w-lg p-10">
      <Vacio
        icono={SearchX}
        titulo="No encontramos esta página"
        accion={
          <Link to="/pacientes" className="btn btn-primary">
            Ir a pacientes
          </Link>
        }
      >
        Revisa la dirección o vuelve a la lista de pacientes.
      </Vacio>
    </div>
  );
}
