import { describe, expect, it } from "vitest";
import { rangoDeCita, rangosDeCitas } from "@/lib/evidencia";

describe("evidencia en la transcripción", () => {
  const texto = "Muy bien, vamos a revisarla. Trae 38.4 de temperatura. La presión está en 148 sobre 92.";

  it("encuentra la cita sin importar mayúsculas, acentos ni puntuación", () => {
    const r = rangoDeCita(texto, "la presion esta en 148 sobre 92");
    expect(r).not.toBeNull();
    expect(texto.slice(r![0], r![1])).toBe("La presión está en 148 sobre 92");
  });

  it("une rangos que se traslapan y descarta citas que no están", () => {
    const rangos = rangosDeCitas(texto, ["Trae 38.4 de temperatura", "38.4 de temperatura. La presión", "no se dijo"]);
    expect(rangos).toHaveLength(1);
    expect(texto.slice(rangos[0][0], rangos[0][1])).toBe("Trae 38.4 de temperatura. La presión");
  });
});
