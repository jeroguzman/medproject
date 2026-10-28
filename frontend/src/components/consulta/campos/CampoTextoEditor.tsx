import { conOrigenEditado, idCampo, type CampoRef } from "@/lib/contenido";
import type { AlertaVista } from "@/lib/alertas";
import { cn } from "@/lib/utils";
import { Segmentado } from "@/components/ui/Segmentado";
import type { CampoTexto, EstadoTexto } from "@/plantilla/valores";
import { MarcoCampo } from "./MarcoCampo";

const LIMITE = { texto: 500, textoLargo: 4000, antecedente: 1000 } as const;

/** "Negado" con la concordancia de cada antecedente. */
const TEXTO_NEGADO: Record<string, string> = { alergias: "Negadas" };

interface Props {
  refCampo: CampoRef;
  valor: CampoTexto;
  onCambio: (valor: CampoTexto) => void;
  avisos: AlertaVista[];
}

function cambiarTexto(v: CampoTexto, texto: string): CampoTexto {
  const hayTexto = texto.trim() !== "";
  const estado: EstadoTexto = !hayTexto ? "sin_informacion" : v.estado === "sin_informacion" ? "referido" : v.estado;
  return conOrigenEditado(v, { ...v, valor: texto === "" ? null : texto, estado });
}

/** texto y textoLargo: textarea con contador. Vacío se ve "— Sin información", nunca normal. */
export function CampoTextoEditor({ refCampo, valor: v, onCambio, avisos }: Props) {
  const tipo = refCampo.campo.tipo === "textoLargo" ? "textoLargo" : "texto";
  const id = `${idCampo(refCampo.ruta)}-control`;
  const largo = (v.valor ?? "").length;
  return (
    <MarcoCampo refCampo={refCampo} idControl={id} origen={v.origen} evidencia={v.evidencia} negado={v.estado === "negado"} avisos={avisos} ancho>
      <textarea
        id={id}
        className={cn("textarea", !v.valor && "bg-canvas")}
        rows={tipo === "textoLargo" ? 4 : 2}
        maxLength={LIMITE[tipo]}
        placeholder="— Sin información"
        value={v.valor ?? ""}
        onChange={(e) => onCambio(cambiarTexto(v, e.target.value))}
        aria-describedby={`${id}-contador`}
      />
      <span id={`${id}-contador`} className="counter justify-self-end">
        {largo} / {LIMITE[tipo]}
      </span>
    </MarcoCampo>
  );
}

/** antecedente: textarea más Referido / Negado / Sin información. "Negado" no es lo mismo que vacío. */
export function CampoAntecedente({ refCampo, valor: v, onCambio, avisos }: Props) {
  const id = `${idCampo(refCampo.ruta)}-control`;
  const largo = (v.valor ?? "").length;
  const elegirEstado = (estado: EstadoTexto) => {
    if (estado === "sin_informacion") {
      onCambio(conOrigenEditado(v, { ...v, valor: null, estado }));
    } else if (estado === "negado") {
      const texto = v.valor?.trim() ? v.valor : (TEXTO_NEGADO[refCampo.campo.clave] ?? "Negados");
      onCambio(conOrigenEditado(v, { ...v, valor: texto, estado }));
    } else {
      onCambio(conOrigenEditado(v, { ...v, estado }));
      if (!v.valor) window.setTimeout(() => document.getElementById(id)?.focus(), 0);
    }
  };
  return (
    <MarcoCampo
      refCampo={refCampo}
      idControl={id}
      origen={v.origen}
      evidencia={v.evidencia}
      avisos={avisos}
      ancho
      acciones={
        <Segmentado
          etiqueta={`Estado de ${refCampo.campo.etiqueta.toLowerCase()}`}
          ocultarEtiqueta
          chico
          valor={v.estado}
          onCambio={elegirEstado}
          opciones={[
            { valor: "referido", etiqueta: "Referido" },
            { valor: "negado", etiqueta: "Negado" },
            { valor: "sin_informacion", etiqueta: "Sin información" },
          ]}
        />
      }
    >
      <textarea
        id={id}
        className={cn("textarea", !v.valor && "bg-canvas")}
        rows={2}
        maxLength={LIMITE.antecedente}
        placeholder={v.estado === "referido" ? "Escribe lo referido" : "— Sin información"}
        value={v.valor ?? ""}
        onChange={(e) => onCambio(cambiarTexto(v, e.target.value))}
        aria-describedby={`${id}-contador`}
      />
      <span id={`${id}-contador`} className="counter justify-self-end">
        {largo} / {LIMITE.antecedente}
      </span>
    </MarcoCampo>
  );
}
