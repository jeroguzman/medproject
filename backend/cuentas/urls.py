from django.urls import path

from cuentas.views import (
    LoginView,
    MeView,
    MojoAuthSocialStartView,
    MojoAuthSocialVerifyView,
    MojoAuthStartView,
    MojoAuthVerifyView,
)

urlpatterns = [
    path("mojoauth/start", MojoAuthStartView.as_view()),
    path("mojoauth/verify", MojoAuthVerifyView.as_view()),
    path("mojoauth/social/start", MojoAuthSocialStartView.as_view()),
    path("mojoauth/social/verify", MojoAuthSocialVerifyView.as_view()),
    path("login", LoginView.as_view()),
    path("me", MeView.as_view()),
]
