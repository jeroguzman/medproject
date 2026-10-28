"""Ejecutar desde raíz: python ia/probar_backboard.py ia/casos/.../transcripcion.json --modo dictado"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from vozclinica_ia.extraccion import ErrorIA, extraer
from vozclinica_ia.filtros import aplicar
from vozclinica_ia.esquema import validar


def main() -> int:
    p = argparse.ArgumentParser(description="VC-12: transcripción -> Backboard -> JSON clínico")
    p.add_argument("transcripcion", type=Path)
    p.add_argument("--modo", choices=["dictado", "consulta"], default="dictado")
    p.add_argument("--salida", type=Path, default=Path("ia/casos/caso_01_faringitis/procesamiento_ia.json"))
    args = p.parse_args()
    if not args.transcripcion.is_file():
        print("No se encontró la transcripción", file=sys.stderr)
        return 2
    trans = json.loads(args.transcripcion.read_text(encoding="utf-8-sig"))
    try:
        raw = extraer(trans, args.modo)
        motivo_original = (
            raw.get("secciones", {})
               .get("motivo_padecimiento", {})
               .get("motivo_consulta")
        )
        print("\n--- MOTIVO ORIGINAL DE LA IA ---")
        print(json.dumps(motivo_original, ensure_ascii=False, indent=2))
        salida, alertas = aplicar(raw, trans, paciente=None, modo=args.modo)
        errores = validar(salida)
        if errores:
            print("Errores de esquema: " + "; ".join(errores), file=sys.stderr)
            return 1
    except (ErrorIA, ValueError) as exc:
        print(f"Error VC-12: {exc}", file=sys.stderr)
        return 1
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"JSON clínico guardado en: {args.salida}")
    print(f"Alertas: {len(alertas)}")
    if alertas:
        print("--- DETALLE DE ALERTAS ---")
        print(json.dumps(alertas, ensure_ascii=False, indent=2))
    print("--- MOTIVO DESPUÉS DEL FILTRO ---")
    print(json.dumps(
        salida["secciones"]["motivo_padecimiento"]["motivo_consulta"],
        ensure_ascii=False,
        indent=2,
    ))
    print("Diagnósticos:", json.dumps(salida["secciones"]["valoracion"]["diagnosticos"], ensure_ascii=False))
    print("Signos vitales:", json.dumps(salida["secciones"]["signos_vitales"], ensure_ascii=False))
    print("ATENCIÓN: borrador de IA; requiere revisión clínica y NO autoriza ninguna nota.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
