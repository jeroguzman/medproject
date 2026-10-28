import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({
  API_URL: "",
  CLAVES_STORAGE: { token: "medvox:token" },
  usaMock: () => false,
}));

import { pedir } from "./cliente";

afterEach(() => vi.unstubAllGlobals());

function respuesta401(codigo: string, mensaje: string) {
  const removeItem = vi.fn();
  const assign = vi.fn();
  vi.stubGlobal("localStorage", { getItem: () => null, removeItem });
  vi.stubGlobal("window", { location: { pathname: "/pacientes", assign } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { codigo, mensaje } }), {
    status: 401, headers: { "Content-Type": "application/json" },
  })));
  return { removeItem, assign };
}

describe("errores de autenticación", () => {
  it("conserva el error del código OTP sin redirigir como si una sesión hubiera vencido", async () => {
    const { removeItem, assign } = respuesta401("codigo_invalido", "El código no es válido o expiró.");
    await expect(pedir("/api/auth/mojoauth/verify", {
      metodo: "POST", cuerpo: { challenge_id: "challenge", otp: "123456" },
    })).rejects.toMatchObject({ status: 401, codigo: "codigo_invalido" });
    expect(removeItem).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("sigue cerrando la sesión ante un 401 de una ruta clínica", async () => {
    const { removeItem, assign } = respuesta401("no_autenticado", "Inicia sesión.");
    await expect(pedir("/api/pacientes")).rejects.toMatchObject({ status: 401, codigo: "sesion_expirada" });
    expect(removeItem).toHaveBeenCalledWith("medvox:token");
    expect(assign).toHaveBeenCalledWith("/login?sesion=expirada");
  });
});
