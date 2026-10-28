"""Pruebas SIN llamadas a ElevenLabs ni claves."""
import unittest

from vozclinica_ia.stt import formatear_para_llm, normalizar_respuesta


class PruebasScribe(unittest.TestCase):
    def test_dos_hablantes_y_puntuacion(self):
        ejemplo = {"text": "Buenos días. Me duele la garganta.", "words": [
            {"text": "Buenos", "type": "word", "speaker_id": "speaker_0", "start": 0.0, "end": 0.4},
            {"text": "días.", "type": "word", "speaker_id": "speaker_0", "start": 0.4, "end": 0.8},
            {"text": "Me", "type": "word", "speaker_id": "speaker_1", "start": 1.1, "end": 1.3},
            {"text": "duele", "type": "word", "speaker_id": "speaker_1", "start": 1.3, "end": 1.5},
            {"text": "la", "type": "word", "speaker_id": "speaker_1", "start": 1.5, "end": 1.6},
            {"text": "garganta.", "type": "word", "speaker_id": "speaker_1", "start": 1.6, "end": 2.2},
        ]}
        resultado = normalizar_respuesta(ejemplo, "consulta")
        self.assertEqual(len(resultado["segmentos"]), 2)
        self.assertEqual(resultado["segmentos"][0]["texto"], "Buenos días.")
        self.assertEqual(resultado["segmentos"][1]["texto"], "Me duele la garganta.")
        self.assertEqual(formatear_para_llm(resultado), "HABLANTE_1: Buenos días.\nHABLANTE_2: Me duele la garganta.")

    def test_dictado_siempre_un_hablante(self):
        ejemplo = {"text": "Juan refiere fiebre", "words": [
            {"text": "Juan", "speaker_id": "speaker_9", "type": "word", "start": 0, "end": 0.3},
            {"text": "refiere", "speaker_id": "speaker_8", "type": "word", "start": 0.3, "end": 0.6},
            {"text": "fiebre", "speaker_id": "speaker_9", "type": "word", "start": 0.6, "end": 0.9},
        ]}
        resultado = normalizar_respuesta(ejemplo, "dictado")
        self.assertEqual(len(resultado["segmentos"]), 1)
        self.assertEqual(resultado["segmentos"][0]["hablante"], "HABLANTE_1")

    def test_sin_palabras_fallback(self):
        resultado = normalizar_respuesta({"text": "Solo texto", "words": []}, "consulta")
        self.assertEqual(resultado["segmentos"][0]["texto"], "Solo texto")

    def test_eventos_no_contaminan(self):
        resultado = normalizar_respuesta({"text": "Hola", "words": [
            {"text": "[laugh]", "type": "audio_event"},
            {"text": "Hola", "type": "word", "speaker_id": "speaker_0", "start": 0, "end": 0.4},
        ]}, "consulta")
        self.assertEqual(resultado["segmentos"][0]["texto"], "Hola")


if __name__ == "__main__":
    unittest.main()
