from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.db import transaction


class Command(BaseCommand):
    help = "Vincula un correo autorizado a un médico existente; no crea cuentas."

    def add_arguments(self, parser):
        parser.add_argument("--usuario", required=True)
        parser.add_argument("--email", required=True)

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().casefold()
        try:
            validate_email(email)
        except ValidationError as exc:
            raise CommandError("El correo no es válido.") from exc
        User = get_user_model()
        user = (
            User.objects.select_for_update()
            .filter(username=options["usuario"], is_active=True)
            .first()
        )
        if user is None or not hasattr(user, "medico"):
            raise CommandError("El usuario debe ser un médico activo existente.")
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise CommandError("Ese correo ya está asociado a otro usuario.")
        user.email = email
        user.save(update_fields=["email"])
        self.stdout.write(self.style.SUCCESS("Correo vinculado al médico autorizado."))
