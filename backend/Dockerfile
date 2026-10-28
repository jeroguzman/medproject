FROM python:3.12-slim@sha256:aa943ce411423c7582288f18707ff66eddcbaeb510502d747a72aeb34f30d159
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --no-create-home app
COPY --chown=app:app backend/ ./
# Paquete de IA de Luis: esquema, filtros, prompt y el caso simulado del modo eco.
COPY --chown=app:app ia/vozclinica_ia/ /app/ia/vozclinica_ia/
COPY --chown=app:app ia/esquemas/ /app/ia/esquemas/
COPY --chown=app:app ia/prompts/ /app/ia/prompts/
COPY --chown=app:app ia/casos/caso_01_faringitis/transcripcion_simulada.json /app/ia/casos/caso_01_faringitis/
RUN mkdir -p staticfiles && chown app:app staticfiles
USER app
EXPOSE 8000
CMD ["python", "-m", "gunicorn", "vozclinica.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "8", "--timeout", "180", "--worker-tmp-dir", "/tmp", "--forwarded-allow-ips", "*", "--no-control-socket"]
