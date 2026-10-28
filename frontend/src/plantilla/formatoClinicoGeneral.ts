// Configuración del Formato Clínico General v1.1 (docs/equipo/german-frontend.md §8).
// Las claves coinciden con el esquema de Luis y con REQUERIMIENTOS §7.2: no las cambies sin avisar a los dos.

export type TipoCampo =
  | "texto" | "textoLargo" | "antecedente" | "vital" | "presion"
  | "imc" | "diagnosticos" | "medicamentos";

export interface CampoConfig {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  unidad?: string;
  obligatorio?: boolean;
  ayuda?: string;
}

export interface GrupoConfig { clave: string; titulo?: string; campos: CampoConfig[] }
export interface SeccionConfig { id: string; numero: string; titulo: string; grupos: GrupoConfig[] }

export const FORMATO_CLINICO_GENERAL: SeccionConfig[] = [
  { id: "motivo", numero: "02", titulo: "Motivo y padecimiento actual", grupos: [
    { clave: "motivo_padecimiento", campos: [
      { clave: "motivo_consulta", etiqueta: "Motivo de consulta", tipo: "texto", obligatorio: true,
        ayuda: "De preferencia en palabras del paciente" },
      { clave: "padecimiento_actual", etiqueta: "Padecimiento actual", tipo: "textoLargo", obligatorio: true,
        ayuda: "Inicio, duración, evolución, síntomas relevantes y tratamientos previos" },
    ] },
  ] },
  { id: "antecedentes", numero: "03", titulo: "Antecedentes", grupos: [
    { clave: "antecedentes", campos: [
      { clave: "heredofamiliares", etiqueta: "Heredofamiliares", tipo: "antecedente" },
      { clave: "personales_patologicos", etiqueta: "Personales patológicos", tipo: "antecedente" },
      { clave: "personales_no_patologicos", etiqueta: "Personales no patológicos (hábitos y exposiciones)", tipo: "antecedente" },
      { clave: "alergias", etiqueta: "Alergias / reacciones", tipo: "antecedente" },
      { clave: "medicamentos_actuales", etiqueta: "Medicamentos actuales y tratamientos previos", tipo: "antecedente" },
    ] },
  ] },
  { id: "interrogatorio", numero: "04", titulo: "Interrogatorio por aparatos y sistemas", grupos: [
    { clave: "interrogatorio", campos: [
      { clave: "aparatos_sistemas", etiqueta: "Datos positivos y negativos relevantes", tipo: "textoLargo",
        ayuda: "Documentar solo lo informado o explorado" },
    ] },
  ] },
  { id: "exploracion", numero: "05", titulo: "Signos vitales y exploración física", grupos: [
    { clave: "signos_vitales", titulo: "Signos vitales", campos: [
      { clave: "presion_arterial", etiqueta: "Presión arterial", tipo: "presion", unidad: "mmHg" },
      { clave: "frecuencia_cardiaca", etiqueta: "Frecuencia cardiaca", tipo: "vital", unidad: "lpm" },
      { clave: "frecuencia_respiratoria", etiqueta: "Frecuencia respiratoria", tipo: "vital", unidad: "rpm" },
      { clave: "temperatura", etiqueta: "Temperatura", tipo: "vital", unidad: "°C" },
      { clave: "saturacion_o2", etiqueta: "Saturación de oxígeno", tipo: "vital", unidad: "%" },
      { clave: "peso", etiqueta: "Peso", tipo: "vital", unidad: "kg" },
      { clave: "talla", etiqueta: "Talla", tipo: "vital", unidad: "cm" },
      { clave: "imc", etiqueta: "IMC", tipo: "imc", unidad: "kg/m²" },
      { clave: "otros_parametros", etiqueta: "Otros parámetros", tipo: "texto" },
    ] },
    { clave: "exploracion_fisica", titulo: "Exploración física", campos: [
      { clave: "habitus_exterior", etiqueta: "Habitus exterior / estado general", tipo: "texto" },
      { clave: "cabeza_cuello", etiqueta: "Cabeza y cuello", tipo: "texto" },
      { clave: "torax_cardiopulmonar", etiqueta: "Tórax y aparato cardiopulmonar", tipo: "texto" },
      { clave: "abdomen", etiqueta: "Abdomen", tipo: "texto" },
      { clave: "extremidades_otros", etiqueta: "Extremidades y otros hallazgos", tipo: "texto" },
      { clave: "genitourinario_otros", etiqueta: "Genitourinario u otras áreas", tipo: "texto" },
    ] },
  ] },
  { id: "estudios", numero: "06", titulo: "Estudios y resultados relevantes", grupos: [
    { clave: "estudios", campos: [
      { clave: "estudios_resultados", etiqueta: "Laboratorio, gabinete u otros", tipo: "textoLargo",
        ayuda: "Resultado, fecha y origen" },
    ] },
  ] },
  { id: "valoracion", numero: "07", titulo: "Valoración clínica", grupos: [
    { clave: "valoracion", campos: [
      { clave: "diagnosticos", etiqueta: "Diagnósticos o problemas clínicos", tipo: "diagnosticos", obligatorio: true },
      { clave: "pronostico", etiqueta: "Pronóstico documentado por el médico", tipo: "texto" },
    ] },
  ] },
  { id: "plan", numero: "08", titulo: "Plan, tratamiento y seguimiento", grupos: [
    { clave: "plan", campos: [
      { clave: "medicamentos", etiqueta: "Medicamentos", tipo: "medicamentos" },
      { clave: "medidas_seguimiento", etiqueta: "Medidas no farmacológicas, estudios solicitados, referencia y seguimiento",
        tipo: "textoLargo" },
    ] },
  ] },
  { id: "revision", numero: "09", titulo: "Revisión y autorización", grupos: [] },
];
