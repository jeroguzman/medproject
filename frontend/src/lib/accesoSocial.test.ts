import { afterEach, describe, expect, it, vi } from "vitest";
import { destinoSeguro, guardarFlujoSocial, tomarFlujoSocial } from "./accesoSocial";

function almacenamiento() {
  const datos = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  });
  return datos;
}

afterEach(() => vi.unstubAllGlobals());

describe("acceso social", () => {
  it("entrega el flujo una sola vez", () => {
    almacenamiento();
    expect(guardarFlujoSocial("flujo-1", "/pacientes/3")).toBe(true);
    expect(tomarFlujoSocial()).toEqual({ flujo: "flujo-1", destino: "/pacientes/3" });
    expect(tomarFlujoSocial()).toBeNull();
  });

  it("nunca redirige fuera de la aplicación", () => {
    for (const destino of ["https://otro.example", "//otro.example", "/\\otro.example", undefined, 42]) {
      expect(destinoSeguro(destino)).toBe("/pacientes");
    }
    expect(destinoSeguro("/notas/7")).toBe("/notas/7");
  });

  it("ignora datos dañados y almacenamiento bloqueado", () => {
    almacenamiento().set("medvox:flujo-social", "{no es json");
    expect(tomarFlujoSocial()).toBeNull();
    vi.stubGlobal("sessionStorage", {
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(guardarFlujoSocial("flujo-1", "/pacientes")).toBe(false);
  });
});
