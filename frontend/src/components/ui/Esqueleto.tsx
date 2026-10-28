/** Carga con la forma del contenido, nunca un indicador giratorio a pantalla completa (DS 6.9). */
export function Esqueleto({ lineas = 4, etiqueta }: { lineas?: number; etiqueta: string }) {
  const anchos = ["40%", "90%", "75%", "60%", "85%", "35%"];
  return (
    <div className="grid gap-3 p-4" aria-busy="true" aria-label={etiqueta}>
      {Array.from({ length: lineas }, (_, i) => (
        <div key={i} className="sk" style={{ width: anchos[i % anchos.length], height: i % 3 === 0 ? 18 : 14 }} />
      ))}
    </div>
  );
}
