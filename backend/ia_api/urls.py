from django.urls import path

from ia_api.views import ProcesarView

urlpatterns = [
    path("procesar", ProcesarView.as_view()),
]
