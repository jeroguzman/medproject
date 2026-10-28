import json
import unittest
from unittest.mock import patch, Mock
from medvox_ia.extraccion import ErrorIA, extraer, parsear, prompt_sistema
from medvox_ia.filtros import aplicar
from medvox_ia.esquema import validar

TRANS = {"texto": "Paciente refiere alergia a penicilina. Mi diagnóstico presuntivo es faringitis.",
         "segmentos": [{"hablante": "HABLANTE_1", "texto": "Paciente refiere alergia a penicilina. Mi diagnóstico presuntivo es faringitis."}]}

class PruebasExtraccion(unittest.TestCase):
    def test_prompt_trae_campos_y_modo(self):
        self.assertIn("motivo_padecimiento", prompt_sistema("dictado"))
        self.assertIn("dictado", prompt_sistema("dictado"))

    def test_json_objeto(self):
        self.assertEqual(parsear('{"secciones": {}}'), {"secciones": {}})
        with self.assertRaises(ErrorIA):
            parsear("hola")

    def test_filtro_evidencia_valida(self):
        raw = {"secciones": {"antecedentes": {"alergias": {
            "valor": "Penicilina", "estado": "referido", "evidencia": ["refiere alergia a penicilina"]}}}}
        data, alerts = aplicar(raw, TRANS, None, "dictado")
        self.assertEqual(data["secciones"]["antecedentes"]["alergias"]["valor"], "Penicilina")
        self.assertEqual(validar(data), [])
        self.assertEqual(alerts, [])

    def test_filtro_borra_cita_inventada(self):
        raw = {"secciones": {"antecedentes": {"alergias": {
            "valor": "Penicilina", "estado": "referido", "evidencia": ["Paciente niega alergia al paracetamol"]}}}}
        data, alertas = aplicar(raw, TRANS, None, "dictado")
        self.assertIsNone(data["secciones"]["antecedentes"]["alergias"]["valor"])
        self.assertEqual(alertas[0]["tipo"], "sin_evidencia")

    def test_listas_ausentes_quedan_vacias(self):
        data, _ = aplicar({}, TRANS, None, "dictado")
        self.assertEqual(data["secciones"]["valoracion"]["diagnosticos"], [])
        self.assertEqual(data["secciones"]["plan"]["medicamentos"], [])
        self.assertEqual(validar(data), [])

    @patch("medvox_ia.extraccion.requests.delete")
    @patch("medvox_ia.extraccion.requests.post")
    @patch.dict("os.environ", {"BACKBOARD_API_KEY": "ficticia", "IA_PROVEEDOR": "openai", "IA_MODELO": "gpt-4o"})
    def test_envio_backboard_con_memoria_off(self, post, delete):
        resp = Mock()
        resp.json.return_value = {"thread_id": "id-ficticio", "status": "COMPLETED", "content": '{"secciones": {}}'}
        post.return_value = resp
        out = extraer(TRANS, "dictado")
        self.assertIn("secciones", out)
        req = post.call_args.kwargs["json"]
        self.assertEqual(req["memory"], "off")
        self.assertTrue(req["json_output"])
        self.assertNotIn("thread_id", req)
        self.assertTrue(delete.called)

if __name__ == "__main__":
    unittest.main()
