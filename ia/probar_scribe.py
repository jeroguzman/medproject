"""Prueba desde PowerShell: python ia/probar_scribe.py ruta_audio.wav --modo consulta"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

from medvox_ia.stt import ErrorTranscripcion, formatear_para_llm, transcribir


def main() -> int:
    cli = argparse.ArgumentParser(description="VC-10: prueba Scribe v2 con audio ficticio")
    cli.add_argument("audio", type=Path, help="Grabación ficticia .wav, .webm, .mp3, etc.")
    cli.add_argument("--modo", choices=["consulta", "dictado"], default="consulta")
    cli.add_argument("--salida", type=Path, default=Path("ia/casos/caso_01_faringitis/transcripcion.json"))
    args = cli.parse_args()
    if not args.audio.is_file():
        print(f"No existe el archivo de audio: {args.audio}", file=sys.stderr)
        return 2
    try:
        inicio = time.monotonic()
        resultado = transcribir(args.audio.read_bytes(), args.audio.name, args.modo)
        segundos = round(time.monotonic() - inicio, 2)
        args.salida.parent.mkdir(parents=True, exist_ok=True)
        args.salida.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Transcripción guardada en: {args.salida}")
        print(f"Tiempo de llamada: {segundos} s")
        print("--- TRANSCRIPCIÓN POR HABLANTE ---")
        print(formatear_para_llm(resultado))
        print("--- FIN ---")
    except ErrorTranscripcion as exc:
        print(f"Error VC-10: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
