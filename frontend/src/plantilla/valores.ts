// Forma de los valores del formato (docs/equipo/german-frontend.md §8 y guía de Luis §5).

export type Origen = "ia" | "editado" | "manual";
export type EstadoTexto = "referido" | "negado" | "sin_informacion";
export type EstadoVital = "medido" | "referido" | "sin_informacion";
export type Condicion = "confirmado" | "presuntivo" | "por_determinar";

export interface CampoTexto {
  valor: string | null;
  estado: EstadoTexto;
  evidencia: string[] | null;
  origen?: Origen;
}

export interface CampoVital {
  valor: number | null;
  unidad?: string;
  estado: EstadoVital;
  evidencia: string[] | null;
  origen?: Origen;
}

export interface ValorPresion {
  sistolica: number | null;
  diastolica: number | null;
}

/** Mientras se captura puede quedar a medias; para autorizar se exigen los dos números. */
export interface CampoPresion {
  valor: ValorPresion | null;
  unidad?: string;
  estado: EstadoVital;
  evidencia: string[] | null;
  origen?: Origen;
}

export interface Diagnostico {
  descripcion: string;
  /** null solo en un renglón nuevo que aún no tiene condición. */
  condicion: Condicion | null;
  cie10?: string | null;
  evidencia: string[] | null;
  origen?: Origen;
}

export interface Medicamento {
  medicamento: string;
  dosis: string | null;
  via: string | null;
  frecuencia: string | null;
  duracion: string | null;
  evidencia: string[] | null;
  origen?: Origen;
}

export type ValorCampo = CampoTexto | CampoVital | CampoPresion | Diagnostico[] | Medicamento[];

/** `secciones` del borrador y `contenido` de una versión de nota: { grupo: { campo: valor } }. */
export type Contenido = Record<string, Record<string, ValorCampo>>;

export type TipoConsulta = "primera_vez" | "seguimiento";
export type ModoCaptura = "dictado" | "consulta";

export interface Segmento {
  hablante: string;
  rol?: "medico" | "paciente" | "acompanante" | "desconocido";
  texto: string;
  inicio?: number;
  fin?: number;
  /** Número de audio dentro del borrador (1, 2, …). Lo agrega el frontend. */
  audio?: number;
}

export interface Transcripcion {
  texto: string;
  segmentos: Segmento[];
}

export type SeveridadAlerta = "critica" | "advertencia" | "info";

export type TipoAlerta =
  | "paciente_no_coincide"
  | "valor_imposible"
  | "fuera_de_rango"
  | "sin_evidencia"
  | "unidad_convertida"
  | "alergia_medicamento";

export interface Alerta {
  tipo: TipoAlerta | string;
  severidad: SeveridadAlerta;
  /** "seccion.campo", "seccion.lista[i]" o null. */
  campo: string | null;
  mensaje: string;
  bloquea: boolean;
}
