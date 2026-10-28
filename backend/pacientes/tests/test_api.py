from datetime import timedelta

from django.apps import apps
from django.utils import timezone
from rest_framework.test import APITestCase
from tests.contracts import assert_schema
from tests.helpers import medico, patient


class PatientGateTests(APITestCase):
    def test_list_protected(self):
        self.assertEqual(self.client.get("/api/pacientes").status_code, 401)

    def test_authenticated_registration(self):
        user, _ = medico()
        self.client.force_authenticate(user=user)
        response = self.client.post(
            "/api/pacientes",
            {
                "nombres": "Paciente",
                "apellido_paterno": "Ficticio",
                "fecha_nacimiento": "2000-01-01",
                "sexo": "no_especificado",
                "alergias": "Sin alergias conocidas",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)


class PatientTests(APITestCase):
    def setUp(self):
        self.user, self.profile = medico()
        self.client.force_authenticate(user=self.user)
        self.patient = patient(self.profile)
        self.payload = {
            "nombres": "Ana",
            "apellido_paterno": "Prueba",
            "fecha_nacimiento": "2000-01-01",
            "sexo": "mujer",
            "alergias": "Sin alergias conocidas",
        }

    def test_search_modes(self):
        for q in [
            "García",
            "garcia",
            "GARCIA",
            "María Fernanda García López",
            "0004-8217",
            "1992-03-12",
            "12/03/1992",
            "",
        ]:
            response = self.client.get("/api/pacientes", {"q": q})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.json()), 1, q)
            assert_schema(self, "Paciente", response.json()[0])
        self.assertEqual(self.client.get("/api/pacientes", {"q": "nadie"}).json(), [])

    def test_create_and_derived_fields(self):
        response = self.client.post("/api/pacientes", self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        assert_schema(self, "Paciente", data)
        self.assertRegex(data["numero_expediente"], r"^\d{4}-\d{4}$")
        self.assertEqual(data["apellido_materno"], "")
        self.assertEqual(data["total_notas"], 0)
        self.assertIsNone(data["ultima_consulta"])
        model = apps.get_model("pacientes", "Paciente").objects.get(pk=data["id"])
        self.assertEqual(model.creado_por_id, self.profile.pk)

    def test_reject_invalid_or_internal_fields_without_inserting(self):
        model = apps.get_model("pacientes", "Paciente")
        invalid = []
        for key in self.payload:
            invalid.append({k: v for k, v in self.payload.items() if k != key})
        invalid += [
            {
                **self.payload,
                "fecha_nacimiento": str(timezone.localdate() + timedelta(days=1)),
            },
            {**self.payload, "sexo": "otro"},
            {**self.payload, "nombres": "  "},
            {**self.payload, "nombres": "a" * 101},
            {**self.payload, "telefono": "1" * 21},
        ]
        for key in [
            "id",
            "numero_expediente",
            "creado_por",
            "creado_en",
            "total_notas",
            "ultima_consulta",
            "tipo_sangre",
            "memoria_ref",
        ]:
            invalid.append({**self.payload, key: "injected"})
        before = model.objects.count()
        for payload in invalid:
            response = self.client.post("/api/pacientes", payload, format="json")
            self.assertEqual(response.status_code, 400, payload)
            assert_schema(self, "Error", response.json())
        self.assertEqual(model.objects.count(), before)

    def test_optional_phone_null_and_whitespace(self):
        response = self.client.post(
            "/api/pacientes",
            {**self.payload, "nombres": "  Ana  ", "telefono": None},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["nombres"], "Ana")
        self.assertIsNone(response.json()["telefono"])

    def test_detail_and_not_found(self):
        response = self.client.get(f"/api/pacientes/{self.patient.pk}")
        self.assertEqual(response.status_code, 200)
        assert_schema(self, "Paciente", response.json())
        self.assertEqual(self.client.get("/api/pacientes/99999").status_code, 404)
        self.assertEqual(self.client.get("/api/pacientes/99999/notas").status_code, 404)

    def test_patient_list_does_not_issue_query_per_row(self):
        patient(self.profile, numero="0004-8218", nombres="Otro")
        with self.assertNumQueries(1):
            response = self.client.get("/api/pacientes")
            self.assertEqual(len(response.json()), 2)
