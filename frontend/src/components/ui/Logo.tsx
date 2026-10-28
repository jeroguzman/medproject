import { cn } from "@/lib/utils";

const VARIANTES = [
  ["logo-claro", "/marca/medvox-logo.svg"],
  ["logo-oscuro", "/marca/medvox-logo-oscuro.svg"],
  ["logo-mono", "/marca/medvox-logo-mono.svg"],
] as const;

/** Logotipo de MedVox. La altura va en className (p. ej. "h-8"); ds.css muestra la variante del tema o la de impresión. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("logo", className)}>
      {VARIANTES.map(([clase, src]) => (
        <img key={clase} className={clase} src={src} alt="MedVox" width={241} height={64} />
      ))}
    </span>
  );
}
