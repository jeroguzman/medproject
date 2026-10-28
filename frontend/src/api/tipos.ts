// Objetos del contrato de la API (docs/equipo/jeroben-backend.md §6).
import type { Alerta, Contenido, ModoCaptura, TipoConsulta, Transcripcion } from "@/plantilla/valores";

export interface Medico {
  id: number;
  nombre_completo: string;
  cedula_profesional: string;
  especialidad?: string;
}

export interface RespuestaLogin {
  access: string;
  medico: Medico;
}

export type Sexo = "mujer" | "hombre" | "no_especificado";

export interface Paciente {
  id: number;
  numero_expediente: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string;
  sexo: Sexo;
  alergias: string;
  tipo_sangre: string | null;
  telefono: string | null;
  ultima_consulta: string | null;
  total_notas: number;
}

export interface PacienteNuevo {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  alergias: string;
  telefono?: string;
}

export type EstadoNota = "autorizada" | "corregida";

export interface NotaResumen {
  id: number;
  fecha_consulta: string;
  hora_atencion: string;
  tipo_consulta: TipoConsulta;
  diagnostico_principal: string | null;
  estado: EstadoNota;
  version_vigente: number;
  medico: string;
}

export interface PlantillaRef {
  clave: "formato_clinico_general";
  version: "1.1";
}

export interface VersionNota {
  numero: number;
  contenido: Contenido;
  transcripcion: Transcripcion | null;
  autorizada_por: string;
  autorizada_en: string;
  motivo_cambio: string | null;
}

export interface NotaDetalle {
  id: number;
  paciente: Paciente;
  medico: Medico;
  plantilla: PlantillaRef;
  fecha_consulta: string;
  hora_atencion: string;
  tipo_consulta: TipoConsulta;
  modo_captura: ModoCaptura;
  consentimiento_grabacion: boolean;
  estado: EstadoNota;
  version_vigente: number;
  versiones: VersionNota[];
}

export interface NotaNueva {
  paciente_id: number;
  plantilla: PlantillaRef;
  fecha_consulta: string;
  hora_atencion: string;
  tipo_consulta: TipoConsulta;
  modo_captura: ModoCaptura;
  consentimiento_grabacion: boolean;
  contenido: Contenido;
  transcripcion: Transcripcion;
}

export interface VersionNueva {
  contenido: Contenido;
  motivo_cambio: string;
  version_base: number;
}

export interface RespuestaProcesar {
  transcripcion: Transcripcion;
  borrador: {
    plantilla: string;
    version: string;
    modo_captura?: ModoCaptura;
    paciente_mencionado?: string | null;
    hablantes?: Record<string, string>;
    secciones: Contenido;
  };
  alertas: Alerta[];
  metricas?: Record<string, number>;
}
