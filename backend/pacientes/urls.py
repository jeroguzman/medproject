from django.urls import path

from pacientes.views import PacienteDetailView, PacientesView

urlpatterns = [
    path("pacientes", PacientesView.as_view()),
    path("pacientes/<int:pk>", PacienteDetailView.as_view()),
]
