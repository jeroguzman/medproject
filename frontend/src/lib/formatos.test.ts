import { describe, expect, it } from "vitest";
import {
  formatearEdad,
  formatearFecha,
  formatearFechaCita,
  formatearFechaHora,
  leerFechaUsuario,
  leerHora,
  leerNumero,
  nombreCabecera,
} from "@/lib/formatos";

describe("formatos (DS §11)", () => {
  it("formatea la fecha sin correrse un día por la zona horaria", () => {
    expect(formatearFecha("1992-03-12")).toBe("12/mar/1992");
    expect(formatearFecha("2026-12-01")).toBe("01/dic/2026");
    expect(formatearFecha(null)).toBe("—");
  });

  it("formatea la fecha de cita con el día de la semana", () => {
    expect(formatearFechaCita("2026-11-03")).toBe("mar 03/nov/2026");
  });

  it("calcula la edad en años, meses o días", () => {
    expect(formatearEdad("1992-03-12", "2026-10-28")).toBe("34 años");
    expect(formatearEdad("1992-10-29", "2026-10-28")).toBe("33 años");
    expect(formatearEdad("2025-04-28", "2026-10-28")).toBe("18 meses");
    expect(formatearEdad("2026-10-16", "2026-10-28")).toBe("12 días");
    expect(formatearEdad("2025-10-28", "2026-10-28")).toBe("12 meses");
    expect(formatearEdad("1992-03-12", "2026-10-28", true)).toBe("34 a");
  });

  it("arma el nombre de cabecera con apellidos en mayúsculas", () => {
    expect(nombreCabecera({ nombres: "María Fernanda", apellido_paterno: "García", apellido_materno: "López" })).toBe(
      "GARCÍA LÓPEZ, María Fernanda",
    );
    expect(nombreCabecera({ nombres: "Jorge", apellido_paterno: "Ramírez", apellido_materno: null })).toBe("RAMÍREZ, Jorge");
  });

  it("muestra fecha y hora en 24 h en la zona de México", () => {
    expect(formatearFechaHora("2026-10-28T10:52:00-06:00")).toBe("28/oct/2026 · 10:52");
    expect(formatearFechaHora("2026-10-28T22:05:00Z")).toBe("28/oct/2026 · 16:05");
  });

  it("lee fechas escritas de varias formas", () => {
    expect(leerFechaUsuario("12/mar/1992")).toBe("1992-03-12");
    expect(leerFechaUsuario("12/03/1992")).toBe("1992-03-12");
    expect(leerFechaUsuario("1992-03-12")).toBe("1992-03-12");
    expect(leerFechaUsuario("31/02/1992")).toBeNull();
    expect(leerFechaUsuario("hola")).toBeNull();
  });

  it("lee horas y números con punto o coma", () => {
    expect(leerHora("9:05")).toBe("09:05");
    expect(leerHora("25:00")).toBeNull();
    expect(leerNumero("38,4")).toBe(38.4);
    expect(leerNumero("")).toBeNull();
    expect(leerNumero("abc")).toBeNaN();
  });
});
