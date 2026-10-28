from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("pacientes", "0001_initial")]
    operations = [
        UnaccentExtension(),
        migrations.RunSQL(
            "CREATE SEQUENCE pacientes_expediente_seq START WITH 48300 MINVALUE 48300 MAXVALUE 99999999",
            "DROP SEQUENCE pacientes_expediente_seq",
        ),
        migrations.RunSQL(
            "SELECT setval('pacientes_expediente_seq', GREATEST(48300, "
            "COALESCE((SELECT MAX(REPLACE(numero_expediente, '-', '')::bigint) + 1 FROM pacientes_paciente), 48300)), false)",
            migrations.RunSQL.noop,
        ),
    ]
