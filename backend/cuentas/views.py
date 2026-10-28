from django.conf import settings
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from cuentas.serializers import LoginSerializer, MedicoSerializer


@method_decorator(never_cache, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
        if settings.AUTH_PROVIDER != "password":
            return Response(
                {
                    "error": {
                        "codigo": "metodo_no_permitido",
                        "mensaje": "Inicia sesión mediante tu correo autorizado.",
                    }
                },
                status=403,
            )
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request=request,
            username=serializer.validated_data["usuario"],
            password=serializer.validated_data["contrasena"],
        )
        if user is None:
            return Response(
                {
                    "error": {
                        "codigo": "credenciales_invalidas",
                        "mensaje": "Usuario o contraseña incorrectos.",
                    }
                },
                status=401,
            )
        if not hasattr(user, "medico"):
            return Response(
                {
                    "error": {
                        "codigo": "sin_permiso",
                        "mensaje": "Necesitas un perfil médico activo.",
                    }
                },
                status=403,
            )
        return Response(
            {
                "access": str(AccessToken.for_user(user)),
                "medico": MedicoSerializer(user.medico).data,
            }
        )


@method_decorator(never_cache, name="dispatch")
class MeView(APIView):
    def get(self, request):
        return Response(MedicoSerializer(request.user.medico).data)


@method_decorator(never_cache, name="dispatch")
class MojoAuthStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "mojoauth_start"

    def post(self, request):
        from cuentas import mojoauth
        from cuentas.serializers import MojoAuthStartSerializer

        data = MojoAuthStartSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        if settings.AUTH_PROVIDER != "mojoauth" or not settings.MOJOAUTH_API_KEY:
            return mojoauth_unavailable()
        try:
            nonce = mojoauth.start(data.validated_data["email"])
        except mojoauth.ProviderUnavailable:
            return mojoauth_unavailable()
        if nonce is None:
            return Response(
                {
                    "error": {
                        "codigo": "demasiados_intentos",
                        "mensaje": "Espera un minuto antes de solicitar otro código.",
                    }
                },
                status=429,
            )
        return Response(
            {"challenge_id": nonce, "message": mojoauth.MESSAGE, "expires_in": 300},
            status=202,
        )


@method_decorator(never_cache, name="dispatch")
class MojoAuthVerifyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "mojoauth_verify"

    def post(self, request):
        from cuentas import mojoauth
        from cuentas.serializers import MojoAuthVerifySerializer

        data = MojoAuthVerifySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        if settings.AUTH_PROVIDER != "mojoauth" or not settings.MOJOAUTH_API_KEY:
            return mojoauth_unavailable()
        user, unavailable = mojoauth.verify(
            data.validated_data["challenge_id"], data.validated_data["otp"]
        )
        if unavailable:
            return mojoauth_unavailable()
        if user is None:
            return Response(
                {
                    "error": {
                        "codigo": "codigo_invalido",
                        "mensaje": "El código no es válido o expiró. Solicita uno nuevo.",
                    }
                },
                status=401,
            )
        return Response(
            {
                "access": str(AccessToken.for_user(user)),
                "medico": MedicoSerializer(user.medico).data,
            }
        )


@method_decorator(never_cache, name="dispatch")
class MojoAuthSocialStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "mojoauth_social_start"

    def post(self, request):
        from cuentas import mojoauth
        from cuentas.serializers import MojoAuthSocialStartSerializer

        data = MojoAuthSocialStartSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            nonce, url = mojoauth.social_start(data.validated_data["proveedor"])
        except mojoauth.ProviderUnavailable:
            return social_unavailable()
        return Response(
            {"flujo": nonce, "url": url, "expires_in": mojoauth.SOCIAL_MINUTES * 60}
        )


@method_decorator(never_cache, name="dispatch")
class MojoAuthSocialVerifyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "mojoauth_social_verify"

    def post(self, request):
        from cuentas import mojoauth
        from cuentas.serializers import MojoAuthSocialVerifySerializer

        data = MojoAuthSocialVerifySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        user, unavailable = mojoauth.social_verify(
            data.validated_data["flujo"], data.validated_data["state_id"]
        )
        if unavailable:
            return social_unavailable()
        if user is None:
            return Response(
                {
                    "error": {
                        "codigo": "acceso_social_invalido",
                        "mensaje": "No pudimos confirmar tu acceso. Entra con la "
                        "cuenta de tu correo autorizado e intenta de nuevo.",
                    }
                },
                status=401,
            )
        return Response(
            {
                "access": str(AccessToken.for_user(user)),
                "medico": MedicoSerializer(user.medico).data,
            }
        )


def social_unavailable():
    return Response(
        {
            "error": {
                "codigo": "autenticacion_no_disponible",
                "mensaje": "Este método de acceso no está disponible en este momento.",
            }
        },
        status=503,
    )


def mojoauth_unavailable():
    return Response(
        {
            "error": {
                "codigo": "autenticacion_no_disponible",
                "mensaje": "El acceso por correo no está disponible en este momento.",
            }
        },
        status=503,
    )
