from django.urls import path

from cuentas.views import LoginView, MeView, MojoAuthStartView, MojoAuthVerifyView

urlpatterns = [
    path("mojoauth/start", MojoAuthStartView.as_view()),
    path("mojoauth/verify", MojoAuthVerifyView.as_view()),
    path("login", LoginView.as_view()),
    path("me", MeView.as_view()),
]
