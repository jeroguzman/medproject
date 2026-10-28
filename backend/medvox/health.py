from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def readiness(request):
    """Infrastructure readiness only: no identity, credentials or clinical data."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        ready = True
    except DatabaseError:
        ready = False
    response = JsonResponse({"ok": ready}, status=200 if ready else 503)
    response["Cache-Control"] = "no-store"
    return response
