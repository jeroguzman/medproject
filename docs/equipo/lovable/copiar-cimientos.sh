#!/usr/bin/env bash
# Copia los "cimientos" del frontend de referencia (frontend/) al repositorio que creó Lovable.
# Son archivos sin pantallas: configuración, cliente de la API, datos de ejemplo, plantilla, reglas,
# hooks y estilos del design system. La UI la genera Lovable con los prompts de README.md.
#
# Uso:
#   docs/equipo/lovable/copiar-cimientos.sh ../medproject-frontend
#
# Después: entra al repo de Lovable, haz commit y push a la rama principal (main).
set -euo pipefail

ORIGEN="$(cd "$(dirname "$0")/../../../frontend" && pwd)"
DESTINO="${1:?Indica la carpeta del repositorio de Lovable, por ejemplo ../medproject-frontend}"

if [ ! -f "$DESTINO/package.json" ] || [ ! -d "$DESTINO/src" ]; then
  echo "No parece un proyecto de Lovable (falta package.json o src/): $DESTINO" >&2
  exit 1
fi

ARCHIVOS=(
  src/config.ts
  src/api/cliente.ts
  src/api/tipos.ts
  src/api/consultas.ts
  src/api/mocks.ts
  src/mocks/login.json
  src/mocks/me.json
  src/mocks/pacientes.json
  src/mocks/paciente_1.json
  src/mocks/notas_paciente_1.json
  src/mocks/nota_12.json
  src/mocks/procesar_faringitis.json
  src/plantilla/formatoClinicoGeneral.ts
  src/plantilla/valores.ts
  src/lib/formatos.ts
  src/lib/contenido.ts
  src/lib/fusion.ts
  src/lib/alertas.ts
  src/lib/vitales.ts
  src/lib/evidencia.ts
  src/lib/borrador.ts
  src/lib/navegacion.ts
  src/hooks/useDocumentoLocal.ts
  src/hooks/useGrabadora.ts
  src/hooks/useAvisoAlSalir.ts
  src/hooks/useTitulo.ts
  src/hooks/useAlto.ts
  src/styles/tokens.css
  src/styles/ds.css
)

for archivo in "${ARCHIVOS[@]}"; do
  mkdir -p "$DESTINO/$(dirname "$archivo")"
  cp "$ORIGEN/$archivo" "$DESTINO/$archivo"
  echo "copiado  $archivo"
done

echo
echo "Listo: ${#ARCHIVOS[@]} archivos. Revisa con git status en $DESTINO, haz commit y push a main."
echo "Lovable sincroniza la rama principal y verá los archivos en unos segundos."
