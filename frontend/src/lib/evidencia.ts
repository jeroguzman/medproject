// Ubica las citas de evidencia dentro de la transcripción para resaltarlas (RF-27, VC-19).
// Compara sin acentos, mayúsculas ni puntuación, igual que el filtro de evidencia de Luis.

function normalizarConMapa(texto: string): { normal: string; mapa: number[] } {
  let normal = "";
  const mapa: number[] = [];
  let ultimoEspacio = true;
  for (let i = 0; i < texto.length; i += 1) {
    const base = texto[i].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    for (const c of base) {
      if (/[\p{L}\p{N}]/u.test(c)) {
        normal += c;
        mapa.push(i);
        ultimoEspacio = false;
      } else if (!ultimoEspacio) {
        normal += " ";
        mapa.push(i);
        ultimoEspacio = true;
      }
    }
  }
  return { normal, mapa };
}

/** Devuelve [inicio, fin) de la cita en el texto original, o null si no aparece. */
export function rangoDeCita(texto: string, cita: string): [number, number] | null {
  const t = normalizarConMapa(texto);
  const c = normalizarConMapa(cita).normal.trim();
  if (c.length < 3) return null;
  const pos = t.normal.indexOf(c);
  if (pos < 0) return null;
  const inicio = t.mapa[pos];
  const fin = t.mapa[pos + c.length - 1] + 1;
  return [inicio, fin];
}

/** Rangos (ordenados y sin traslapes) de todas las citas dentro de un texto. */
export function rangosDeCitas(texto: string, citas: string[]): Array<[number, number]> {
  const rangos = citas
    .map((c) => rangoDeCita(texto, c))
    .filter((r): r is [number, number] => r !== null)
    .sort((a, b) => a[0] - b[0]);
  const unidos: Array<[number, number]> = [];
  for (const r of rangos) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && r[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], r[1]);
    else unidos.push([...r]);
  }
  return unidos;
}
