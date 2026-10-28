import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from vozclinica_ia.esquema import cargar, validar, validar_contenido, contenido_vacio
import json
from jsonschema import Draft202012Validator

root=Path(__file__).resolve().parent
Draft202012Validator.check_schema(cargar())
assert not validar_contenido(contenido_vacio()), "contenido_vacio inválido"
for name in ("procesar_faringitis.json", "procesar_trampa.json"):
    with (root / "esquemas" / "ejemplos" / name).open(encoding="utf-8") as fp:
        obj=json.load(fp)
    errores=validar(obj)
    assert not errores, f"{name}: {errores}"
    assert not validar_contenido(obj["secciones"])
print("VC-01: esquema, contenido vacío y 2 ejemplos válidos.")
