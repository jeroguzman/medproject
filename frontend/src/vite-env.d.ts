/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: "password" | "mojoauth";
  readonly VITE_API_URL?: string;
  readonly VITE_USAR_MOCKS?: string;
  /** Proveedores sociales habilitados en MojoAuth, por ejemplo "google,facebook". */
  readonly VITE_MOJOAUTH_SOCIAL?: string;
}
