from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("notas", "0002_initial")]
    operations = [
        migrations.RunSQL(
            sql="""
        CREATE FUNCTION proteger_version_nota() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'Las versiones autorizadas son inmutables.' USING ERRCODE = '23000';
        END;
        $$;
        CREATE TRIGGER version_nota_inmutable BEFORE UPDATE OR DELETE ON notas_versionnota
        FOR EACH ROW EXECUTE FUNCTION proteger_version_nota();
        """,
            reverse_sql="""
        DROP TRIGGER version_nota_inmutable ON notas_versionnota;
        DROP FUNCTION proteger_version_nota();
        """,
        )
    ]
