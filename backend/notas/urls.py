from django.urls import path

from notas.views import HistorialView, NotaDetailView

urlpatterns = [
    path("pacientes/<int:pk>/notas", HistorialView.as_view()),
    path("notas/<int:pk>", NotaDetailView.as_view()),
]
