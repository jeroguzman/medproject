import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

SPEC = json.loads(
    (
        Path(__file__).resolve().parents[2]
        / "specs/001-acceso-pacientes/contracts/openapi.json"
    ).read_text()
)


def assert_schema(testcase, name, data):
    schema = {"$ref": f"#/components/schemas/{name}", "components": SPEC["components"]}
    errors = list(
        Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(data)
    )
    testcase.assertEqual(
        errors, [], f"Respuesta fuera de contrato {name}: {[e.message for e in errors]}"
    )
