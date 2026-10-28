from django.urls import path

from notas.views import HistorialView, NotaDetailView, NotasView

urlpatterns = [
    path("notas", NotasView.as_view()),
    path("pacientes/<int:pk>/notas", HistorialView.as_view()),
    path("notas/<int:pk>", NotaDetailView.as_view()),
]
