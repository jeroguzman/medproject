from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from cuentas.serializers import LoginSerializer, MedicoSerializer


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
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


class MeView(APIView):
    def get(self, request):
        return Response(MedicoSerializer(request.user.medico).data)
