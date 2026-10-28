// Llamadas a la API con TanStack Query.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pedir } from "@/api/cliente";
import type {
  Medico,
  NotaDetalle,
  NotaNueva,
  NotaResumen,
  Paciente,
  PacienteNuevo,
  RespuestaLogin,
  RespuestaProcesar,
  VersionNueva,
} from "@/api/tipos";
import type { ModoCaptura } from "@/plantilla/valores";

export const claves = {
  medico: ["medico"] as const,
  pacientes: (q: string) => ["pacientes", q] as const,
  paciente: (id: number) => ["paciente", id] as const,
  notasPaciente: (id: number) => ["paciente", id, "notas"] as const,
  nota: (id: number) => ["nota", id] as const,
};

export function iniciarSesion(usuario: string, contrasena: string) {
  return pedir<RespuestaLogin>("/api/auth/login", { metodo: "POST", cuerpo: { usuario, contrasena } });
}

export function useMedico() {
  return useQuery({ queryKey: claves.medico, queryFn: () => pedir<Medico>("/api/auth/me"), staleTime: Infinity });
}

export function usePacientes(q: string) {
  return useQuery({
    queryKey: claves.pacientes(q),
    queryFn: () => pedir<Paciente[]>(`/api/pacientes?q=${encodeURIComponent(q)}`),
    placeholderData: keepPreviousData,
  });
}

/** Búsqueda para detectar duplicados al registrar; no se ejecuta si el texto es muy corto. */
export function useCoincidencias(q: string) {
  return useQuery({
    queryKey: ["coincidencias", q],
    queryFn: () => pedir<Paciente[]>(`/api/pacientes?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 3,
    staleTime: 30_000,
  });
}

export function usePaciente(id: number) {
  return useQuery({ queryKey: claves.paciente(id), queryFn: () => pedir<Paciente>(`/api/pacientes/${id}`), enabled: id > 0 });
}

export function useNotasPaciente(id: number) {
  return useQuery({
    queryKey: claves.notasPaciente(id),
    queryFn: () => pedir<NotaResumen[]>(`/api/pacientes/${id}/notas`),
    enabled: id > 0,
  });
}

export function useNota(id: number) {
  return useQuery({ queryKey: claves.nota(id), queryFn: () => pedir<NotaDetalle>(`/api/notas/${id}`), enabled: id > 0 });
}

export function useRegistrarPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: PacienteNuevo) => pedir<Paciente>("/api/pacientes", { metodo: "POST", cuerpo: datos }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacientes"] });
      qc.invalidateQueries({ queryKey: ["coincidencias"] });
    },
  });
}

function refrescarNota(qc: ReturnType<typeof useQueryClient>, nota: NotaDetalle) {
  qc.setQueryData(claves.nota(nota.id), nota);
  qc.invalidateQueries({ queryKey: claves.paciente(nota.paciente.id) });
  qc.invalidateQueries({ queryKey: ["pacientes"] });
}

export function useAutorizarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: NotaNueva) => pedir<NotaDetalle>("/api/notas", { metodo: "POST", cuerpo: datos }),
    onSuccess: (nota) => refrescarNota(qc, nota),
  });
}

export function useAutorizarCorreccion(notaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: VersionNueva) => pedir<NotaDetalle>(`/api/notas/${notaId}/versiones`, { metodo: "POST", cuerpo: datos }),
    onSuccess: (nota) => refrescarNota(qc, nota),
  });
}

/** POST /api/ia/procesar en multipart. No guarda nada en el servidor (RF-17). */
export function procesarAudio(audio: Blob, nombreArchivo: string, pacienteId: number, modo: ModoCaptura, signal: AbortSignal) {
  const datos = new FormData();
  datos.append("audio", audio, nombreArchivo);
  datos.append("paciente_id", String(pacienteId));
  datos.append("modo", modo);
  return pedir<RespuestaProcesar>("/api/ia/procesar", { metodo: "POST", cuerpo: datos, signal });
}
