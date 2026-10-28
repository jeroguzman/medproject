from django.test.runner import DiscoverRunner


class NonEmptyDiscoverRunner(DiscoverRunner):
    def build_suite(self, test_labels=None, **kwargs):
        suite = super().build_suite(test_labels, **kwargs)
        if suite.countTestCases() == 0:
            raise RuntimeError(
                "No se ejecutaron pruebas: revisa las etiquetas y el descubrimiento."
            )
        return suite
