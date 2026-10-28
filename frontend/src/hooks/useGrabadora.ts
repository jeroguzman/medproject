import { useCallback, useEffect, useRef, useState } from "react";
import { LIMITES } from "@/config";
import { formatearDuracion } from "@/lib/formatos";

export type EstadoGrabadora = "lista" | "grabando" | "pausada" | "audio_listo" | "procesando" | "error";

export interface InfoAudio {
  nombre: string;
  url: string;
  duracion: number | null;
  tamano: number;
  origen: "grabacion" | "archivo";
}

export type ErrorMicrofono = "permiso" | "sin_microfono" | "no_soportado" | "otro";

const EXTENSIONES = ["mp3", "m4a", "wav", "webm", "ogg", "mp4", "aac"];

function tipoDeGrabacion(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function duracionDeArchivo(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const terminar = (valor: number | null) => {
      audio.removeAttribute("src");
      resolve(valor);
    };
    const t = window.setTimeout(() => terminar(null), 5000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      window.clearTimeout(t);
      terminar(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => {
      window.clearTimeout(t);
      terminar(null);
    };
    audio.src = url;
  });
}

/**
 * Grabadora con MediaRecorder (prompt 7). El audio vive solo en memoria (useRef): nunca va a localStorage
 * y se descarta después de procesarlo (RF-13).
 */
export function useGrabadora() {
  const [estado, setEstado] = useState<EstadoGrabadora>("lista");
  const [segundos, setSegundos] = useState(0);
  const [nivel, setNivel] = useState(0);
  const [info, setInfo] = useState<InfoAudio | null>(null);
  const [errorMicrofono, setErrorMicrofono] = useState<ErrorMicrofono | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [errorProceso, setErrorProceso] = useState<string | null>(null);

  const audio = useRef<Blob | null>(null);
  const grabador = useRef<MediaRecorder | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const contexto = useRef<AudioContext | null>(null);
  const animacion = useRef<number | null>(null);
  const reloj = useRef<number | null>(null);
  const acumulado = useRef(0);
  const inicio = useRef(0);
  const urlActual = useRef<string | null>(null);

  const liberarMicrofono = useCallback(() => {
    if (animacion.current !== null) cancelAnimationFrame(animacion.current);
    animacion.current = null;
    if (reloj.current !== null) window.clearInterval(reloj.current);
    reloj.current = null;
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
    void contexto.current?.close().catch(() => undefined);
    contexto.current = null;
    setNivel(0);
  }, []);

  const ponerAudio = useCallback((blob: Blob, datos: Omit<InfoAudio, "url" | "tamano">) => {
    if (urlActual.current) URL.revokeObjectURL(urlActual.current);
    const url = URL.createObjectURL(blob);
    urlActual.current = url;
    audio.current = blob;
    setInfo({ ...datos, url, tamano: blob.size });
    setEstado("audio_listo");
  }, []);

  const descartarAudio = useCallback(() => {
    if (urlActual.current) URL.revokeObjectURL(urlActual.current);
    urlActual.current = null;
    audio.current = null;
    setInfo(null);
    setSegundos(0);
    setErrorProceso(null);
    setErrorArchivo(null);
    setEstado("lista");
  }, []);

  const tiempoTranscurrido = () => acumulado.current + (performance.now() - inicio.current) / 1000;

  const detener = useCallback(() => {
    const rec = grabador.current;
    if (!rec || rec.state === "inactive") return;
    if (rec.state === "recording") acumulado.current = tiempoTranscurrido();
    setSegundos(acumulado.current);
    rec.stop();
  }, []);

  const grabar = useCallback(async () => {
    setErrorMicrofono(null);
    setErrorArchivo(null);
    setErrorProceso(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErrorMicrofono("no_soportado");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const nombre = e instanceof DOMException ? e.name : "";
      setErrorMicrofono(
        nombre === "NotAllowedError" || nombre === "SecurityError" ? "permiso" : nombre === "NotFoundError" ? "sin_microfono" : "otro",
      );
      return;
    }
    flujo.current = stream;
    const tipo = tipoDeGrabacion();
    const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    const partes: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) partes.push(e.data);
    };
    rec.onstop = () => {
      liberarMicrofono();
      const mime = rec.mimeType || tipo || "audio/webm";
      const blob = new Blob(partes, { type: mime });
      const extension = mime.includes("mp4") ? "m4a" : "webm";
      const marca = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      ponerAudio(blob, { nombre: `grabacion-${marca}.${extension}`, duracion: acumulado.current, origen: "grabacion" });
    };
    grabador.current = rec;

    // Medidor de nivel con AnalyserNode.
    try {
      const ctx = new AudioContext();
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analizador);
      contexto.current = ctx;
      const datos = new Uint8Array(analizador.fftSize);
      const medir = () => {
        analizador.getByteTimeDomainData(datos);
        let suma = 0;
        for (const v of datos) suma += ((v - 128) / 128) ** 2;
        setNivel(Math.min(1, Math.sqrt(suma / datos.length) * 3));
        animacion.current = requestAnimationFrame(medir);
      };
      medir();
    } catch {
      // Sin medidor de nivel la grabación sigue funcionando.
    }

    acumulado.current = 0;
    inicio.current = performance.now();
    setSegundos(0);
    rec.start(1000);
    setEstado("grabando");
    reloj.current = window.setInterval(() => {
      if (grabador.current?.state !== "recording") return;
      const t = tiempoTranscurrido();
      setSegundos(t);
      if (t >= LIMITES.duracionAudioS) detener(); // Se detiene sola a los 20:00.
    }, 250);
  }, [detener, liberarMicrofono, ponerAudio]);

  const pausar = useCallback(() => {
    const rec = grabador.current;
    if (rec?.state !== "recording") return;
    acumulado.current = tiempoTranscurrido();
    rec.pause();
    setSegundos(acumulado.current);
    setEstado("pausada");
  }, []);

  const reanudar = useCallback(() => {
    const rec = grabador.current;
    if (rec?.state !== "paused") return;
    inicio.current = performance.now();
    rec.resume();
    setEstado("grabando");
  }, []);

  const cargarArchivo = useCallback(
    async (archivo: File) => {
      setErrorArchivo(null);
      setErrorMicrofono(null);
      setErrorProceso(null);
      const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
      if (!archivo.type.startsWith("audio/") && !EXTENSIONES.includes(extension)) {
        setErrorArchivo("Ese archivo no es de audio. Sube un mp3, m4a, wav o webm.");
        return;
      }
      if (archivo.size > LIMITES.tamanoAudioBytes) {
        const mb = (archivo.size / 1024 / 1024).toFixed(1);
        setErrorArchivo(`El archivo pesa ${mb} MB y el máximo es 50 MB. Sube un audio más corto o comprimido.`);
        return;
      }
      const url = URL.createObjectURL(archivo);
      const duracion = await duracionDeArchivo(url);
      URL.revokeObjectURL(url);
      if (duracion !== null && duracion > LIMITES.duracionAudioS) {
        setErrorArchivo(`El audio dura ${formatearDuracion(duracion)} y el máximo es 20:00. Recórtalo o divídelo en dos audios.`);
        return;
      }
      setSegundos(duracion ?? 0);
      ponerAudio(archivo, { nombre: archivo.name, duracion, origen: "archivo" });
    },
    [ponerAudio],
  );

  const marcarProcesando = useCallback(() => {
    setErrorProceso(null);
    setEstado("procesando");
  }, []);

  const marcarError = useCallback((mensaje: string) => {
    setErrorProceso(mensaje);
    setEstado("error");
  }, []);

  const volverAAudioListo = useCallback(() => {
    setErrorProceso(null);
    setEstado(audio.current ? "audio_listo" : "lista");
  }, []);

  useEffect(
    () => () => {
      if (grabador.current && grabador.current.state !== "inactive") {
        grabador.current.onstop = null;
        grabador.current.stop();
      }
      liberarMicrofono();
      if (urlActual.current) URL.revokeObjectURL(urlActual.current);
      audio.current = null;
    },
    [liberarMicrofono],
  );

  return {
    estado,
    segundos,
    nivel,
    info,
    errorMicrofono,
    errorArchivo,
    errorProceso,
    /** El audio en memoria; null si no hay. */
    tomarAudio: () => audio.current,
    grabar,
    pausar,
    reanudar,
    detener,
    cargarArchivo,
    descartarAudio,
    marcarProcesando,
    marcarError,
    volverAAudioListo,
  };
}
