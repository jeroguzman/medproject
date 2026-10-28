import unittest
from medvox_ia.filtros import _evidencia_valida


class PruebasLimitesEvidencia(unittest.TestCase):

    def test_dosis_truncada(self):
        self.assertFalse(
            _evidencia_valida(
                ["paracetamol de 500"],
                "paracetamol de 5000 mg"
            )
        )

    def test_temperatura_truncada(self):
        self.assertFalse(
            _evidencia_valida(
                ["8.4 de temperatura"],
                "38.4 de temperatura"
            )
        )

    def test_evidencia_correcta(self):
        self.assertTrue(
            _evidencia_valida(
                ["paracetamol de 500 mg"],
                "Se indicó paracetamol de 500 mg."
            )
        )


if __name__ == "__main__":
    unittest.main()
