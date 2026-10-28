import { Ban, CircleAlert, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { InsigniaOrigen } from "@/components/consulta/InsigniaOrigen";
import { ZonaEvidencia } from "@/components/consulta/ZonaEvidencia";
import { Insignia } from "@/components/ui/Insignia";
import { textoAviso, type AlertaVista } from "@/lib/alertas";
import { idCampo, type CampoRef } from "@/lib/contenido";
import type { Origen } from "@/plantilla/valores";

interface Props {
  refCampo: CampoRef;
  /** id del control principal, para el <label>. Sin él, la etiqueta es un título del grupo. */
  idControl?: string;
  origen?: Origen;
  evidencia?: string[] | null;
  negado?: boolean;
  /** Avisos de la IA de este campo (sin evidencia, unidad convertida…). */
  avisos?: AlertaVista[];
  /** Controles a la derecha de la etiqueta (por ejemplo, Referido / Negado / Sin información). */
  acciones?: ReactNode;
  children: ReactNode;
  ancho?: boolean;
}

/** Etiqueta, insignias de origen, ayuda, evidencia y avisos de un campo del formato. */
export function MarcoCampo({ refCampo, idControl, origen, evidencia, negado, avisos = [], acciones, children, ancho }: Props) {
  const { campo, ruta } = refCampo;
  const idEtiqueta = `${idCampo(ruta)}-etiqueta`;
  const Etiqueta = idControl ? "label" : "h3";
  return (
    <ZonaEvidencia
      id={idCampo(ruta)}
      citas={evidencia}
      activa={origen === "ia" || origen === "editado"}
      className={ancho ? "field md:col-span-2" : "field"}
    >
      <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1">
        <Etiqueta id={idEtiqueta} htmlFor={idControl} className="field-label">
          {campo.etiqueta}
          {campo.obligatorio && (
            <span className="req" title="Obligatorio para autorizar">
              *<span className="sr-only"> obligatorio para autorizar</span>
            </span>
          )}
        </Etiqueta>
        <InsigniaOrigen origen={origen} />
        {negado && (
          <Insignia variante="neutral" icono={Ban}>
            Negado
          </Insignia>
        )}
        {acciones && <div className="ml-auto">{acciones}</div>}
      </div>
      {campo.ayuda && <p className="help -mt-1">{campo.ayuda}</p>}
      {children}
      {avisos.map((a) => (
        <MensajeAlerta key={a.id} alerta={a} />
      ))}
    </ZonaEvidencia>
  );
}

export function MensajeAlerta({ alerta, accion }: { alerta: AlertaVista; accion?: ReactNode }) {
  const critica = alerta.severidad === "critica";
  const clase = alerta.severidad === "info" ? "msg-info" : critica ? "msg-error" : "msg-warning";
  const Icono = alerta.severidad === "info" ? Info : alerta.tipo === "valor_imposible" ? CircleAlert : critica ? OctagonAlert : TriangleAlert;
  return (
    <p className={`msg ${clase}`}>
      <Icono aria-hidden="true" />
      <span>
        {textoAviso(alerta)} {accion}
      </span>
    </p>
  );
}
