// Backend simulado para trabajar sin la API (docs/equipo/german-frontend.md §12).
// Responde con los archivos de src/mocks/ y guarda los cambios (pacientes y notas autorizadas) en una
// base de datos de ejemplo en localStorage. Solo datos ficticios. Para empezar de cero: /?reiniciar-mocks
import type { Medico, NotaDetalle, NotaNueva, NotaResumen, Paciente, PacienteNuevo, VersionNueva } from "@/api/tipos";
import { CLAVES_STORAGE } from "@/config";
import { calcularFaltantes, completarContenido, contenidoVacio } from "@/lib/contenido";
import { ahoraEnMexico, leerFechaUsuario, nombreNatural, normalizarTexto } from "@/lib/formatos";
import type { Contenido, Diagnostico } from "@/plantilla/valores";
import login from "@/mocks/login.json";
import me from "@/mocks/me.json";
import nota12 from "@/mocks/nota_12.json";
import notasPaciente1 from "@/mocks/notas_paciente_1.json";
import paciente1 from "@/mocks/paciente_1.json";
import pacientes from "@/mocks/pacientes.json";
import procesarFaringitis from "@/mocks/procesar_faringitis.json";

type PacienteBase = Omit<Paciente, "ultima_consulta" | "total_notas">;

interface Db {
  version: 1;
  pacientes: PacienteBase[];
  notas: NotaDetalle[];
}

const MEDICOS: Record<string, Medico & { contrasena: string }> = {
  pmendez: { ...me, contrasena: "demo1234" },
  esalas: { id: 2, nombre_completo: "Dr. Ernesto Salas Ibarra", cedula_profesional: "87654321", especialidad: "Medicina general", contrasena: "demo1234" },
};

const sinCampos = ({ ultima_consulta: _u, total_notas: _t, ...base }: Paciente): PacienteBase => base;

function notaSemilla(
  id: number,
  paciente: PacienteBase,
  medico: Medico,
  resumen: Pick<NotaResumen, "fecha_consulta" | "hora_atencion" | "tipo_consulta">,
  datos: { motivo: string; padecimiento: string; diagnostico: string; medicamento?: [string, string, string, string]; medidas?: string },
): NotaDetalle {
  const contenido = contenidoVacio();
  contenido.motivo_padecimiento.motivo_consulta = { valor: datos.motivo, estado: "referido", evidencia: null };
  contenido.motivo_padecimiento.padecimiento_actual = { valor: datos.padecimiento, estado: "referido", evidencia: null };
  contenido.valoracion.diagnosticos = [{ descripcion: datos.diagnostico, condicion: "confirmado", evidencia: null }];
  if (datos.medicamento) {
    const [medicamento, dosis, frecuencia, duracion] = datos.medicamento;
    contenido.plan.medicamentos = [{ medicamento, dosis, via: "oral", frecuencia, duracion, evidencia: null }];
  }
  if (datos.medidas) contenido.plan.medidas_seguimiento = { valor: datos.medidas, estado: "referido", evidencia: null };
  const { especialidad: _e, ...medicoNota } = medico;
  return {
    id,
    paciente: { ...paciente, ultima_consulta: null, total_notas: 0 },
    medico: medicoNota,
    plantilla: { clave: "formato_clinico_general", version: "1.1" },
    ...resumen,
    modo_captura: "dictado",
    consentimiento_grabacion: false,
    estado: "autorizada",
    version_vigente: 1,
    versiones: [
      {
        numero: 1,
        contenido,
        transcripcion: null,
        autorizada_por: medico.nombre_completo,
        autorizada_en: `${resumen.fecha_consulta}T${resumen.hora_atencion}:00-06:00`,
        motivo_cambio: null,
      },
    ],
  };
}

function crearDb(): Db {
  const base = (pacientes as Paciente[]).map((p) => (p.id === 1 ? (paciente1 as Paciente) : p)).map(sinCampos);
  const [garcia, ramirez, castillo] = base;
  const [, control, ivu] = notasPaciente1 as NotaResumen[];
  return {
    version: 1,
    pacientes: base,
    notas: [
      nota12 as unknown as NotaDetalle,
      notaSemilla(11, garcia, MEDICOS.pmendez, control, {
        motivo: "Control anual",
        padecimiento: "Acude a revisión anual. Asintomática.",
        diagnostico: "Control anual sin hallazgos relevantes",
        medidas: "Continuar con actividad física y control anual.",
      }),
      notaSemilla(10, garcia, MEDICOS.esalas, ivu, {
        motivo: "Ardor al orinar",
        padecimiento: "Disuria y polaquiuria de 3 días de evolución, sin fiebre.",
        diagnostico: "Infección de vías urinarias",
        medicamento: ["Nitrofurantoína", "100 mg", "cada 12 h", "5 días"],
      }),
      notaSemilla(13, ramirez, MEDICOS.pmendez, { fecha_consulta: "2026-07-10", hora_atencion: "09:00", tipo_consulta: "seguimiento" }, {
        motivo: "Control de presión arterial",
        padecimiento: "Hipertensión arterial de 4 años de diagnóstico, en tratamiento con losartán. Sin cefalea ni dolor torácico.",
        diagnostico: "Hipertensión arterial sistémica",
        medicamento: ["Losartán", "50 mg", "cada 24 h", "continuo"],
      }),
      notaSemilla(14, castillo, MEDICOS.pmendez, { fecha_consulta: "2026-06-15", hora_atencion: "11:00", tipo_consulta: "seguimiento" }, {
        motivo: "Seguimiento de diabetes",
        padecimiento: "Diabetes mellitus tipo 2 en tratamiento con metformina. Glucosa capilar en ayuno de 142 mg/dL.",
        diagnostico: "Diabetes mellitus tipo 2",
        medicamento: ["Metformina", "850 mg", "cada 12 h", "continuo"],
      }),
    ],
  };
}

let db: Db | null = null;

function obtenerDb(): Db {
  if (db) return db;
  try {
    if (new URLSearchParams(window.location.search).has("reiniciar-mocks")) localStorage.removeItem(CLAVES_STORAGE.mockDb);
    const guardada = JSON.parse(localStorage.getItem(CLAVES_STORAGE.mockDb) ?? "null") as Db | null;
    db = guardada?.version === 1 ? guardada : crearDb();
  } catch {
    db = crearDb();
  }
  return db;
}

function guardarDb(): void {
  try {
    localStorage.setItem(CLAVES_STORAGE.mockDb, JSON.stringify(db));
  } catch {
    // Si no cabe, la base de ejemplo vive solo en memoria.
  }
}

const json = (status: number, cuerpo: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
const error = (status: number, codigo: string, mensaje: string, extra: Record<string, unknown> = {}) =>
  json(status, { error: { codigo, mensaje, ...extra } });

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Cancelado", "AbortError"));
    });
  });
}

const ahoraIso = () => {
  const { fecha, hora } = ahoraEnMexico();
  return `${fecha}T${hora}:${String(new Date().getSeconds()).padStart(2, "0")}-06:00`;
};

function vigente(nota: NotaDetalle) {
  return nota.versiones.find((v) => v.numero === nota.version_vigente) ?? nota.versiones[0];
}

function resumen(nota: NotaDetalle): NotaResumen {
  const dx = (vigente(nota).contenido.valoracion?.diagnosticos ?? []) as Diagnostico[];
  return {
    id: nota.id,
    fecha_consulta: nota.fecha_consulta,
    hora_atencion: nota.hora_atencion,
    tipo_consulta: nota.tipo_consulta,
    diagnostico_principal: dx[0]?.descripcion ?? null,
    estado: nota.estado,
    version_vigente: nota.version_vigente,
    medico: nota.medico.nombre_completo,
  };
}

function notasDe(pacienteId: number): NotaDetalle[] {
  return obtenerDb()
    .notas.filter((n) => n.paciente.id === pacienteId)
    .sort((a, b) => `${b.fecha_consulta}${b.hora_atencion}`.localeCompare(`${a.fecha_consulta}${a.hora_atencion}`));
}

function conCalculados(p: PacienteBase): Paciente {
  const notas = notasDe(p.id);
  return { ...p, ultima_consulta: notas[0]?.fecha_consulta ?? null, total_notas: notas.length };
}

function notaConPaciente(nota: NotaDetalle): NotaDetalle {
  const paciente = obtenerDb().pacientes.find((p) => p.id === nota.paciente.id);
  return { ...nota, paciente: paciente ? conCalculados(paciente) : nota.paciente, versiones: [...nota.versiones].sort((a, b) => b.numero - a.numero) };
}

function buscar(q: string): Paciente[] {
  const lista = obtenerDb().pacientes.map(conCalculados);
  const texto = q.trim();
  if (!texto) return lista.sort((a, b) => a.apellido_paterno.localeCompare(b.apellido_paterno, "es"));
  const fecha = leerFechaUsuario(texto);
  if (fecha) return lista.filter((p) => p.fecha_nacimiento === fecha);
  const buscado = normalizarTexto(texto);
  return lista.filter((p) => {
    const campos = [p.nombres, p.apellido_paterno, p.apellido_materno ?? "", p.numero_expediente, nombreNatural(p), `${p.apellido_paterno} ${p.apellido_materno ?? ""}`];
    return campos.some((c) => normalizarTexto(c).includes(buscado)) || p.numero_expediente.includes(texto);
  });
}

function siguienteExpediente(): string {
  const numeros = obtenerDb().pacientes.map((p) => Number(p.numero_expediente.replace("-", "")));
  const n = Math.max(48299, ...numeros) + 1;
  return `${String(Math.floor(n / 10000)).padStart(4, "0")}-${String(n % 10000).padStart(4, "0")}`;
}

/** Faltantes con el formato de la API ("valoracion.diagnosticos"), sin repetir rutas. */
function faltantesApi(contenido: Contenido, extra: Parameters<typeof calcularFaltantes>[0]): string[] {
  return [...new Set(calcularFaltantes({ ...extra, contenido }).map((f) => f.ruta.replace(/^identificacion\./, "")))];
}

export async function responderMock(
  metodo: string,
  rutaCompleta: string,
  cuerpo: unknown,
  token: string | null,
  signal?: AbortSignal,
): Promise<Response> {
  await esperar(250, signal);
  const [ruta, consulta = ""] = rutaCompleta.split("?");
  const partes = ruta.split("/").filter(Boolean); // ["api", "pacientes", "1", "notas"]
  const parametros = new URLSearchParams(consulta);

  if (metodo === "POST" && ruta === "/api/auth/login") {
    const { usuario, contrasena } = (cuerpo ?? {}) as { usuario?: string; contrasena?: string };
    const medico = usuario ? MEDICOS[usuario.trim().toLowerCase()] : undefined;
    if (!medico || medico.contrasena !== contrasena) {
      return error(401, "credenciales_invalidas", "Usuario o contraseña incorrectos.");
    }
    const { contrasena: _c, ...datos } = medico;
    return json(200, { ...login, access: `mock:${usuario!.trim().toLowerCase()}`, medico: datos });
  }

  const usuario = token?.startsWith("mock:") ? token.slice(5) : null;
  const medicoActual = usuario ? MEDICOS[usuario] : undefined;
  if (!medicoActual) return error(401, "no_autenticado", "Inicia sesión para continuar.");
  const { contrasena: _c, ...medico } = medicoActual;
  const base = obtenerDb();

  if (metodo === "GET" && ruta === "/api/auth/me") return json(200, medico);

  if (partes[1] === "pacientes") {
    if (partes.length === 2 && metodo === "GET") return json(200, buscar(parametros.get("q") ?? ""));
    if (partes.length === 2 && metodo === "POST") {
      const datos = (cuerpo ?? {}) as Partial<PacienteNuevo>;
      const faltan = (["nombres", "apellido_paterno", "fecha_nacimiento", "sexo", "alergias"] as const).filter(
        (k) => !String(datos[k] ?? "").trim(),
      );
      if (faltan.length) return error(400, "validacion", "Faltan datos obligatorios.", { faltantes: faltan });
      const nuevo: PacienteBase = {
        id: Math.max(0, ...base.pacientes.map((p) => p.id)) + 1,
        numero_expediente: siguienteExpediente(),
        nombres: datos.nombres!.trim(),
        apellido_paterno: datos.apellido_paterno!.trim(),
        apellido_materno: datos.apellido_materno?.trim() || null,
        fecha_nacimiento: datos.fecha_nacimiento!,
        sexo: datos.sexo!,
        alergias: datos.alergias!.trim(),
        tipo_sangre: null,
        telefono: datos.telefono?.trim() || null,
      };
      base.pacientes.push(nuevo);
      guardarDb();
      return json(201, conCalculados(nuevo));
    }
    const paciente = base.pacientes.find((p) => p.id === Number(partes[2]));
    if (!paciente) return error(404, "no_encontrado", "No encontramos a este paciente.");
    if (partes.length === 3 && metodo === "GET") return json(200, conCalculados(paciente));
    if (partes[3] === "notas" && metodo === "GET") return json(200, notasDe(paciente.id).map(resumen));
  }

  if (partes[1] === "plantillas" && metodo === "GET") {
    return json(200, { clave: "formato_clinico_general", version: "1.1", esquema: {} });
  }

  if (metodo === "POST" && ruta === "/api/ia/procesar") {
    const datos = cuerpo instanceof FormData ? cuerpo : null;
    const audio = datos?.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) return error(400, "audio_invalido", "No llegó ningún audio. Graba o sube un archivo.");
    if (audio.size > 50 * 1024 * 1024) return error(413, "audio_muy_grande", "El audio supera 50 MB.");
    const paciente = base.pacientes.find((p) => p.id === Number(datos?.get("paciente_id")));
    if (!paciente) return error(404, "no_encontrado", "No encontramos a este paciente.");
    // Igual que el modo "eco" del backend: espera unos segundos y devuelve el ejemplo de faringitis.
    await esperar(3000, signal);
    const respuesta = structuredClone(procesarFaringitis) as typeof procesarFaringitis & { alertas: unknown[] };
    const modo = datos?.get("modo") === "dictado" ? "dictado" : "consulta";
    respuesta.borrador.modo_captura = modo;
    if (modo === "dictado") {
      for (const s of respuesta.transcripcion.segmentos) s.rol = "medico";
    }
    // El audio de ejemplo menciona a María Fernanda García: con cualquier otro paciente salta la alerta (CA-11).
    if (paciente.id !== 1) {
      respuesta.alertas.unshift({
        tipo: "paciente_no_coincide",
        severidad: "critica",
        campo: null,
        mensaje: `En el audio se menciona a «${respuesta.borrador.paciente_mencionado}», pero la consulta es de ${nombreNatural(paciente)}.`,
        bloquea: true,
      });
    }
    return json(200, respuesta);
  }

  if (partes[1] === "notas") {
    if (partes.length === 2 && metodo === "POST") {
      const datos = cuerpo as NotaNueva;
      const paciente = base.pacientes.find((p) => p.id === Number(datos?.paciente_id));
      if (!paciente) return error(404, "no_encontrado", "No encontramos a este paciente.");
      const contenido = completarContenido(datos.contenido);
      const faltantes = faltantesApi(contenido, {
        contenido,
        identificacion: datos,
        modoCaptura: datos.modo_captura,
        consentimiento: datos.consentimiento_grabacion,
      });
      if (faltantes.length) return error(400, "validacion", "Faltan campos obligatorios para autorizar.", { faltantes });
      const nota: NotaDetalle = {
        id: Math.max(100, ...base.notas.map((n) => n.id)) + 1,
        paciente: conCalculados(paciente),
        medico: { id: medico.id, nombre_completo: medico.nombre_completo, cedula_profesional: medico.cedula_profesional },
        plantilla: { clave: "formato_clinico_general", version: "1.1" },
        fecha_consulta: datos.fecha_consulta,
        hora_atencion: datos.hora_atencion,
        tipo_consulta: datos.tipo_consulta,
        modo_captura: datos.modo_captura,
        consentimiento_grabacion: datos.consentimiento_grabacion,
        estado: "autorizada",
        version_vigente: 1,
        versiones: [
          {
            numero: 1,
            contenido,
            transcripcion: datos.transcripcion ?? null,
            autorizada_por: medico.nombre_completo,
            autorizada_en: ahoraIso(),
            motivo_cambio: null,
          },
        ],
      };
      base.notas.push(nota);
      guardarDb();
      return json(201, notaConPaciente(nota));
    }
    const nota = base.notas.find((n) => n.id === Number(partes[2]));
    if (!nota) return error(404, "no_encontrado", "No encontramos esta nota.");
    if (partes.length === 3 && metodo === "GET") return json(200, notaConPaciente(nota));
    if (partes[3] === "versiones" && metodo === "POST") {
      const datos = cuerpo as VersionNueva;
      if (datos.version_base !== nota.version_vigente) {
        return error(409, "version_desactualizada", "La nota cambió mientras la corregías.");
      }
      const contenido = completarContenido(datos.contenido);
      const faltantes = faltantesApi(contenido, { contenido });
      if (!datos.motivo_cambio?.trim()) faltantes.push("motivo_cambio");
      if (faltantes.length) return error(400, "validacion", "Faltan campos obligatorios para autorizar.", { faltantes });
      const numero = nota.version_vigente + 1;
      nota.versiones.push({
        numero,
        contenido,
        transcripcion: vigente(nota).transcripcion,
        autorizada_por: medico.nombre_completo,
        autorizada_en: ahoraIso(),
        motivo_cambio: datos.motivo_cambio.trim(),
      });
      nota.version_vigente = numero;
      nota.estado = "corregida";
      guardarDb();
      return json(201, notaConPaciente(nota));
    }
  }

  return error(404, "no_encontrado", `El backend de ejemplo no tiene ${metodo} ${ruta}.`);
}
