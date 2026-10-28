import { CircleAlert, FileAudio, Loader2, Mic, Pause, Play, RotateCcw, Sparkles, Square, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mensajeDeError } from "@/api/cliente";
import { procesarAudio } from "@/api/consultas";
import type { RespuestaProcesar } from "@/api/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { Insignia } from "@/components/ui/Insignia";
import { Segmentado } from "@/components/ui/Segmentado";
import { LIMITES } from "@/config";
import { useGrabadora, type ErrorMicrofono } from "@/hooks/useGrabadora";
import { formatearDuracion } from "@/lib/formatos";
import type { DatosAudio } from "@/lib/fusion";
import type { ModoCaptura } from "@/plantilla/valores";

const MENSAJES_MICROFONO: Record<ErrorMicrofono, { titulo: string; cuerpo: string }> = {
  permiso: {
    titulo: "El navegador no tiene permiso para usar el micrófono",
    cuerpo:
      "Haz clic en el icono del candado junto a la dirección de la página, en «Micrófono» elige «Permitir» y vuelve a pulsar Grabar. También puedes subir un archivo de audio.",
  },
  sin_microfono: {
    titulo: "No encontramos un micrófono",
    cuerpo: "Conecta un micrófono o unos audífonos con micrófono y vuelve a intentar, o sube un archivo de audio.",
  },
  no_soportado: {
    titulo: "Este navegador no permite grabar",
    cuerpo: "Usa Chrome o Edge recientes en una página con HTTPS, o sube un archivo de audio.",
  },
  otro: {
    titulo: "No se pudo usar el micrófono",
    cuerpo: "Puede estar ocupado por otra aplicación (por ejemplo, una videollamada). Ciérrala y vuelve a intentar, o sube un archivo.",
  },
};

interface Props {
  pacienteId: number;
  /** Cuántos audios ya se procesaron en este borrador (RF-14). */
  audiosPrevios: number;
  onProcesado: (respuesta: RespuestaProcesar, audio: DatosAudio) => void;
}

/** Grabadora y subida de archivo, con modos y consentimiento (prompt 7, VC-09). */
export function Grabadora({ pacienteId, audiosPrevios, onProcesado }: Props) {
  const g = useGrabadora();
  const [modo, setModo] = useState<ModoCaptura>("dictado");
  const [consentimiento, setConsentimiento] = useState(false);
  const [transcurrido, setTranscurrido] = useState(0);
  const control = useRef<AbortController | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  const sinConsentimiento = modo === "consulta" && !consentimiento;
  const ocupado = g.estado === "grabando" || g.estado === "pausada" || g.estado === "procesando";
  const conAudio = g.estado === "audio_listo" || g.estado === "error" || g.estado === "procesando";

  // Si el médico sale de la pantalla mientras se procesa, se cancela la petición.
  useEffect(() => () => control.current?.abort(), []);

  const procesar = async () => {
    const audio = g.tomarAudio();
    if (!audio || !g.info) return;
    const ctrl = new AbortController();
    control.current = ctrl;
    let porTiempo = false;
    const limite = window.setTimeout(() => {
      porTiempo = true;
      ctrl.abort();
    }, LIMITES.timeoutProcesarMs);
    const inicio = Date.now();
    setTranscurrido(0);
    const reloj = window.setInterval(() => setTranscurrido((Date.now() - inicio) / 1000), 500);
    g.marcarProcesando();
    try {
      const respuesta = await procesarAudio(audio, g.info.nombre, pacienteId, modo, ctrl.signal);
      onProcesado(respuesta, { modo, consentimiento: modo === "consulta" && consentimiento });
      g.descartarAudio(); // El audio se descarta después de procesarlo (RF-13).
      toast.success("Listo: la IA llenó el formato. Revisa cada campo antes de autorizar.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (porTiempo) g.marcarError("El procesamiento tardó más de 3 minutos. Tu audio sigue aquí: reintenta o usa un audio más corto.");
        else g.volverAAudioListo();
      } else {
        g.marcarError(mensajeDeError(error));
      }
    } finally {
      window.clearTimeout(limite);
      window.clearInterval(reloj);
      control.current = null;
    }
  };

  const etapa = transcurrido < 15 ? "Transcribiendo el audio…" : "Llenando el formato…";

  return (
    <section id="campo-grabadora" tabIndex={-1} aria-labelledby="titulo-grabadora" className="card grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-grabadora" className="t-title-md flex items-center gap-2">
          <Mic className="h-5 w-5 text-accion-texto" aria-hidden="true" />
          Audio de la consulta
        </h2>
        <EstadoInsignia estado={g.estado} />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Segmentado
          etiqueta="Modo de captura"
          valor={modo}
          deshabilitado={ocupado || conAudio}
          onCambio={(m) => setModo(m)}
          opciones={[
            { valor: "dictado", etiqueta: "Dictado" },
            { valor: "consulta", etiqueta: "Consulta" },
          ]}
        />
        {modo === "consulta" && (
          <label className="check">
            <input
              type="checkbox"
              checked={consentimiento}
              disabled={ocupado || conAudio}
              onChange={(e) => setConsentimiento(e.target.checked)}
              aria-describedby="ayuda-consentimiento"
            />
            <span>
              El paciente autorizó la grabación<span className="req"> *</span>
            </span>
          </label>
        )}
      </div>
      <p id="ayuda-consentimiento" className="help -mt-2">
        {modo === "dictado"
          ? "Dictado: solo hablas tú. Consulta: se graba la conversación con el paciente y necesitas su autorización."
          : "En modo Consulta hay que marcar el consentimiento del paciente antes de grabar o subir un audio. Se guarda con la nota."}
      </p>

      {g.errorMicrofono && (
        <Aviso variante="critical" titulo={MENSAJES_MICROFONO[g.errorMicrofono].titulo}>
          {MENSAJES_MICROFONO[g.errorMicrofono].cuerpo}
        </Aviso>
      )}
      {g.errorArchivo && (
        <Aviso variante="critical" titulo="No se pudo usar ese archivo">
          {g.errorArchivo}
        </Aviso>
      )}

      {g.estado === "lista" && (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-secondary" disabled={sinConsentimiento} onClick={() => void g.grabar()}>
              <Mic className="h-5 w-5" aria-hidden="true" />
              Grabar
            </button>
            <button type="button" className="btn btn-secondary" disabled={sinConsentimiento} onClick={() => archivo.current?.click()}>
              <Upload className="h-5 w-5" aria-hidden="true" />
              Subir archivo
            </button>
            <input
              ref={archivo}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.webm"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void g.cargarArchivo(f);
              }}
            />
          </div>
          {sinConsentimiento ? (
            <p className="msg msg-warning">
              <CircleAlert aria-hidden="true" />
              Para grabar o subir un archivo, marca primero «El paciente autorizó la grabación».
            </p>
          ) : (
            <p className="help">
              Máximo 20 minutos por audio. Archivos mp3, m4a, wav o webm de hasta 50 MB.
              {audiosPrevios > 0 && " Ya procesaste un audio: el nuevo solo llena los campos vacíos y nunca cambia lo que ya tiene valor."}
            </p>
          )}
        </div>
      )}

      {(g.estado === "grabando" || g.estado === "pausada") && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="t-title-md tnum" aria-live="off">
            {formatearDuracion(g.segundos)} <span className="t-body-sm text-texto-muted">/ 20:00</span>
          </span>
          <MedidorNivel nivel={g.estado === "grabando" ? g.nivel : 0} />
          <div className="ml-auto flex gap-2">
            {g.estado === "grabando" ? (
              <button type="button" className="btn btn-secondary" onClick={g.pausar}>
                <Pause className="h-5 w-5" aria-hidden="true" />
                Pausar
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={g.reanudar}>
                <Play className="h-5 w-5" aria-hidden="true" />
                Reanudar
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={g.detener}>
              <Square className="h-5 w-5" aria-hidden="true" />
              Detener
            </button>
          </div>
        </div>
      )}

      {(g.estado === "audio_listo" || g.estado === "error") && g.info && (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-canvas p-3">
            <FileAudio className="h-5 w-5 text-texto-muted" aria-hidden="true" />
            <div className="min-w-0">
              <p className="t-label truncate">{g.info.nombre}</p>
              <p className="t-caption tnum text-texto-muted">
                {g.info.duracion ? formatearDuracion(g.info.duracion) : "Duración desconocida"} · {(g.info.tamano / 1024 / 1024).toFixed(1)} MB · solo
                en la memoria de este navegador
              </p>
            </div>
            <audio controls src={g.info.url} className="h-10 min-w-[240px] flex-1" aria-label="Escuchar el audio antes de procesarlo" />
          </div>
          {g.estado === "error" && g.errorProceso && (
            <Aviso variante="critical" titulo="No se pudo procesar el audio">
              {g.errorProceso}
            </Aviso>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" onClick={g.descartarAudio}>
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              {g.info.origen === "grabacion" ? "Volver a grabar" : "Elegir otro audio"}
            </button>
            <button type="button" className="btn btn-primary ml-auto" onClick={() => void procesar()}>
              {g.estado === "error" ? <RotateCcw className="h-5 w-5" aria-hidden="true" /> : <Sparkles className="h-5 w-5" aria-hidden="true" />}
              {g.estado === "error" ? "Reintentar" : "Procesar audio"}
            </button>
          </div>
        </div>
      )}

      {g.estado === "procesando" && (
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-info-border bg-info-bg p-4" role="status" aria-live="polite">
          <Loader2 className="spin h-6 w-6 text-info-fg" aria-hidden="true" />
          <div>
            <p className="t-label text-base">{etapa}</p>
            <p className="t-body-sm tnum text-texto-muted">{formatearDuracion(transcurrido)} · puede tardar hasta un minuto por cada 5 min de audio</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={() => control.current?.abort()}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancelar
          </button>
        </div>
      )}
    </section>
  );
}

function EstadoInsignia({ estado }: { estado: string }) {
  switch (estado) {
    case "grabando":
      return (
        <Insignia variante="critical" icono={Mic}>
          Grabando
        </Insignia>
      );
    case "pausada":
      return (
        <Insignia variante="warning" icono={Pause}>
          Pausada
        </Insignia>
      );
    case "audio_listo":
      return (
        <Insignia variante="action" icono={FileAudio}>
          Audio listo
        </Insignia>
      );
    case "procesando":
      return (
        <Insignia variante="info" icono={Loader2}>
          Procesando
        </Insignia>
      );
    case "error":
      return (
        <Insignia variante="critical" icono={CircleAlert}>
          Error
        </Insignia>
      );
    default:
      return (
        <Insignia variante="neutral" icono={Mic}>
          Lista
        </Insignia>
      );
  }
}

/** Medidor de nivel de audio. */
function MedidorNivel({ nivel }: { nivel: number }) {
  const barras = 16;
  const activas = Math.round(nivel * barras);
  return (
    <div
      role="meter"
      aria-label="Nivel del micrófono"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(nivel * 100)}
      className="flex h-8 items-end gap-0.5"
    >
      {Array.from({ length: barras }, (_, i) => (
        <span
          key={i}
          className={i < activas ? "bg-accion" : "bg-border"}
          style={{ width: 5, height: `${30 + (i / barras) * 70}%`, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}
