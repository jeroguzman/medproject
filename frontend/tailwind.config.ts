import type { Config } from "tailwindcss";

// Los colores leen directamente los tokens semánticos del DS (src/styles/tokens.css),
// así el modo oscuro y cualquier ajuste se hacen en un solo lugar.
const v = (nombre: string) => `var(--${nombre})`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // Clases del DS (src/styles/ds.css) que se usan con nombres armados en tiempo de ejecución.
  safelist: [{ pattern: /^(btn|b|alert|badge|seg|msg|vstatus|s|is|pb|t)-/ }],
  theme: {
    extend: {
      colors: {
        background: v("background"),
        foreground: v("foreground"),
        card: { DEFAULT: v("card"), foreground: v("card-foreground") },
        popover: { DEFAULT: v("popover"), foreground: v("popover-foreground") },
        primary: { DEFAULT: v("primary"), foreground: v("primary-foreground") },
        secondary: { DEFAULT: v("secondary"), foreground: v("secondary-foreground") },
        muted: { DEFAULT: v("muted"), foreground: v("muted-foreground") },
        accent: { DEFAULT: v("accent"), foreground: v("accent-foreground") },
        destructive: { DEFAULT: v("destructive"), foreground: v("destructive-foreground") },
        border: v("border"),
        input: v("input"),
        ring: v("ring"),
        // Tokens del DS con su nombre original
        bg: v("color-bg"),
        surface: { DEFAULT: v("color-surface"), hover: v("color-surface-hover"), raised: v("color-surface-raised") },
        canvas: v("color-canvas"),
        texto: { DEFAULT: v("color-text"), muted: v("color-text-muted"), subtle: v("color-text-subtle") },
        accion: {
          DEFAULT: v("color-action"),
          hover: v("color-action-hover"),
          fg: v("color-action-fg"),
          texto: v("color-action-text"),
          subtle: v("color-action-subtle"),
          "subtle-border": v("color-action-subtle-border"),
        },
        critico: { bg: v("color-critical-bg"), border: v("color-critical-border"), fg: v("color-critical-fg"), solid: v("color-critical-solid") },
        advertencia: { bg: v("color-warning-bg"), border: v("color-warning-border"), fg: v("color-warning-fg"), solid: v("color-warning-solid") },
        exito: { bg: v("color-success-bg"), border: v("color-success-border"), fg: v("color-success-fg"), solid: v("color-success-solid") },
        info: { bg: v("color-info-bg"), border: v("color-info-border"), fg: v("color-info-fg"), solid: v("color-info-solid") },
        banner: { bg: v("color-banner-bg"), fg: v("color-banner-fg"), muted: v("color-banner-muted") },
        resaltado: v("color-highlight"),
      },
      borderColor: { DEFAULT: v("color-border") },
      borderRadius: { sm: "4px", md: "8px", lg: "12px", xl: "16px" },
      fontFamily: {
        sans: ["Atkinson Hyperlegible Next", "Atkinson Hyperlegible", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Atkinson Hyperlegible Mono", "ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: { 1: v("shadow-1"), 2: v("shadow-2"), 3: v("shadow-3") },
      height: { control: v("control-h"), "control-sm": v("control-h-sm") },
      minHeight: { control: v("control-h"), "control-sm": v("control-h-sm") },
    },
  },
  plugins: [],
} satisfies Config;
