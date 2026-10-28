#!/usr/bin/env python3
"""Build the Spec Kit task view from the editable checklists for each teammate."""
from __future__ import annotations

import argparse
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FEATURE = ROOT / "specs" / "001-acceso-pacientes"
MEMBERS = (("german", "German", "Frontend e integración"),
           ("jeroben", "Jeroben", "Backend e infraestructura"),
           ("luis", "Luis", "Contrato clínico compartido"))
TASK = re.compile(r"^- \[([ xX])\] (T\d{3}) (?:\[P\] )?(?:\[US\d+\] )?.+")


def render() -> str:
    entries = []
    seen: set[str] = set()
    for slug, name, role in MEMBERS:
        source = FEATURE / "tasks" / f"{slug}.md"
        sections = []
        count = done = 0
        for line in source.read_text(encoding="utf-8").splitlines():
            if line.startswith("## Phase "):
                sections.append("#" + line)
            elif line.startswith("- ["):
                match = TASK.fullmatch(line)
                if not match:
                    raise ValueError(f"Formato de tarea inválido en {source}: {line}")
                state, task_id = match.groups()
                if task_id in seen:
                    raise ValueError(f"ID duplicado: {task_id}")
                seen.add(task_id)
                count += 1
                done += state.lower() == "x"
                sections.append(line)
        if not count:
            raise ValueError(f"Sin tareas en {source}")
        entries.append((slug, name, role, count, done, sections))
    expected = {f"T{i:03d}" for i in range(1, 46)}
    if seen != expected:
        raise ValueError(f"IDs faltantes: {sorted(expected-seen)}; extra: {sorted(seen-expected)}")
    out = ["# Tasks: Acceso del médico y gestión de pacientes — por miembro", "",
           "**Feature**: `001-acceso-pacientes`. **Branch**: `work`.", "",
           "Vista generada por `python3 scripts/sync-team-tasks.py`. Las fuentes editables",
           "son los archivos individuales enlazados abajo. Actualiza allí las casillas y",
           "regenera esta vista; no mantengas estados distintos en ambas ubicaciones.", "",
           "**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),",
           "[data-model.md](data-model.md), [API](contracts/openapi.json),",
           "[interfaz](contracts/ui.md) y [quickstart.md](quickstart.md).", "",
           "US1/US2 son P1/M; US3 es P2/S. `[P]` permite trabajo en paralelo una vez",
           "resueltos los prerrequisitos; cada tarea tiene un responsable único. Las rutas",
           "de aplicación son destinos previstos. Las casillas describen trabajo futuro.", "",
           "| Miembro | Área | Tareas | Completadas | Fuente editable |",
           "|---|---|---|---|---|"]
    for slug, name, role, count, done, _ in entries:
        out.append(f"| {name} | {role} | {count} | {done} | [{slug}.md](tasks/{slug}.md) |")
    out += ["", f"**Total**: {len(seen)} tareas. T001–T043 conservan sus IDs; T044/T045",
            "separan configuración y runners frontend de tareas antes mixtas.", ""]
    for slug, name, _, _, _, sections in entries:
        out += [f"## {name}", "", f"Fuente: [tasks/{slug}.md](tasks/{slug}.md).", ""]
        for line in sections:
            out += [line, ""]
    coordination = (FEATURE / "tasks" / "coordination.md").read_text(encoding="utf-8")
    coordination = re.sub(r"^# (.+)$", r"## \1", coordination, flags=re.M)
    for slug, _, _ in MEMBERS:
        coordination = coordination.replace(f"]({slug}.md)", f"](tasks/{slug}.md)")
    out += [coordination.rstrip(), ""]
    return "\n".join(out)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if tasks.md is out of date")
    args = parser.parse_args()
    try:
        content = render()
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1
    output = FEATURE / "tasks.md"
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != content:
            print("tasks.md desactualizado: ejecuta python3 scripts/sync-team-tasks.py", file=sys.stderr)
            return 1
        print("OK: tasks.md coincide con las 3 listas individuales (45 tareas únicas).")
    else:
        output.write_text(content, encoding="utf-8")
        print("Generado specs/001-acceso-pacientes/tasks.md desde las 3 listas individuales.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
