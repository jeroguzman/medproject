FROM node:22-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Public build configuration only. No API keys or passwords belong here.
ARG VITE_API_URL=""
ARG VITE_USAR_MOCKS=false
ARG VITE_AUTH_PROVIDER=mojoauth
ARG VITE_MOJOAUTH_SOCIAL=""
RUN npm run build

FROM caddy:2@sha256:5e5286cb37d44086d651a5363f05f43a692ce4d649d88fb1bd844579f45fa9e8
COPY --from=frontend-build /app/frontend/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
