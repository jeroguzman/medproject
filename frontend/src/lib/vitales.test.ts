import { describe, expect, it } from "vitest";
import { calcularImc, evaluarPresion, evaluarVital } from "@/lib/vitales";

describe("signos vitales (RF-28)", () => {
  it("distingue imposible, fuera de rango y normal", () => {
    expect(evaluarVital("temperatura", 38.4).nivel).toBe("advertencia");
    expect(evaluarVital("temperatura", 36.8).nivel).toBe("ok");
    expect(evaluarVital("temperatura", 50).nivel).toBe("error");
    expect(evaluarVital("saturacion_o2", 88).nivel).toBe("critico");
    expect(evaluarVital("frecuencia_cardiaca", null).nivel).toBe("vacio");
  });

  it("sugiere centímetros si la talla viene en metros", () => {
    const r = evaluarVital("talla", 1.62);
    expect(r.nivel).toBe("error");
    expect(r.sugerencia).toBe(162);
  });

  it("en menores solo aplica los límites de imposible", () => {
    expect(evaluarVital("frecuencia_cardiaca", 120, true).nivel).toBe("ok");
    expect(evaluarVital("frecuencia_cardiaca", 300, true).nivel).toBe("error");
  });

  it("valida la presión arterial", () => {
    const campo = (s: number | null, d: number | null) => ({ valor: { sistolica: s, diastolica: d }, estado: "medido" as const, evidencia: null });
    expect(evaluarPresion(campo(148, 92)).nivel).toBe("advertencia");
    expect(evaluarPresion(campo(120, 80)).nivel).toBe("ok");
    expect(evaluarPresion(campo(80, 120)).nivel).toBe("error");
    expect(evaluarPresion(campo(120, null)).nivel).toBe("error");
  });

  it("calcula el IMC con la talla en cm", () => {
    const v = (valor: number) => ({ valor, estado: "medido" as const, evidencia: null });
    expect(calcularImc(v(68.5), v(162))).toEqual({ valor: 26.1, clasificacion: "Sobrepeso" });
    expect(calcularImc(v(68.5), v(1.62))).toBeNull();
  });
});
