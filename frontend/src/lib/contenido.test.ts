import { describe, expect, it } from "vitest";
import {
  calcularFaltantes,
  completarContenido,
  conOrigenEditado,
  contenidoVacio,
  prepararContenido,
  resumirContenido,
} from "@/lib/contenido";
import type { CampoTexto } from "@/plantilla/valores";

describe("contenido del formato", () => {
  it("el contenido vacío trae todas las secciones y no guarda el IMC", () => {
    const c = contenidoVacio();
    expect(Object.keys(c)).toEqual([
      "motivo_padecimiento",
      "antecedentes",
      "interrogatorio",
      "signos_vitales",
      "exploracion_fisica",
      "estudios",
      "valoracion",
      "plan",
    ]);
    expect(c.signos_vitales.imc).toBeUndefined();
    expect(c.signos_vitales.temperatura).toEqual({ valor: null, unidad: "°C", estado: "sin_informacion", evidencia: null });
    expect(c.valoracion.diagnosticos).toEqual([]);
  });

  it("aplica las reglas de origen al editar (prompt 6)", () => {
    const deIa: CampoTexto = { valor: "Odinofagia", estado: "referido", evidencia: ["me duele"], origen: "ia" };
    expect(conOrigenEditado(deIa, { ...deIa, valor: "Odinofagia intensa" }).origen).toBe("editado");
    // Si se borra un valor de la IA queda sin información, pero editado.
    const borrado = conOrigenEditado(deIa, { ...deIa, valor: null, estado: "sin_informacion" });
    expect(borrado).toMatchObject({ valor: null, estado: "sin_informacion", origen: "editado" });
    const vacio: CampoTexto = { valor: null, estado: "sin_informacion", evidencia: null };
    expect(conOrigenEditado(vacio, { ...vacio, valor: "Fiebre", estado: "referido" }).origen).toBe("manual");
    const manual: CampoTexto = { valor: "x", estado: "referido", evidencia: null, origen: "manual" };
    expect(conOrigenEditado(manual, { ...manual, valor: "", estado: "sin_informacion" }).origen).toBeUndefined();
  });

  it("calcula los obligatorios para autorizar (P-04)", () => {
    const c = contenidoVacio();
    const rutas = () =>
      calcularFaltantes({
        contenido: c,
        identificacion: { fecha_consulta: "2026-10-28", hora_atencion: "10:30", tipo_consulta: "seguimiento" },
      }).map((f) => f.ruta);
    expect(rutas()).toEqual([
      "motivo_padecimiento.motivo_consulta",
      "motivo_padecimiento.padecimiento_actual",
      "valoracion.diagnosticos",
      "plan.medicamentos",
    ]);
    c.motivo_padecimiento.motivo_consulta = { valor: "Dolor", estado: "referido", evidencia: null };
    c.motivo_padecimiento.padecimiento_actual = { valor: "Dolor desde ayer", estado: "referido", evidencia: null };
    c.valoracion.diagnosticos = [{ descripcion: "Faringitis", condicion: null, evidencia: null }];
    c.plan.medidas_seguimiento = { valor: "Reposo", estado: "referido", evidencia: null };
    expect(rutas()).toEqual(["valoracion.diagnosticos", "valoracion.diagnosticos"]);
    c.valoracion.diagnosticos = [{ descripcion: "Faringitis", condicion: "presuntivo", evidencia: null }];
    expect(rutas()).toEqual([]);
  });

  it("exige el consentimiento si algún audio fue de consulta", () => {
    const f = calcularFaltantes({ contenido: contenidoVacio(), modoCaptura: "consulta", consentimiento: false });
    expect(f.map((x) => x.ruta)).toContain("grabadora");
  });

  it("prepara el contenido para la API sin renglones vacíos ni textos huecos", () => {
    const c = contenidoVacio();
    c.motivo_padecimiento.motivo_consulta = { valor: "  ", estado: "referido", evidencia: null, origen: "editado" };
    c.plan.medicamentos = [
      { medicamento: "", dosis: null, via: null, frecuencia: null, duracion: null, evidencia: null },
      { medicamento: " Paracetamol ", dosis: " ", via: null, frecuencia: "cada 8 h", duracion: null, evidencia: null, origen: "manual" },
    ];
    const listo = prepararContenido(c);
    expect(listo.motivo_padecimiento.motivo_consulta).toEqual({ valor: null, estado: "sin_informacion", evidencia: null, origen: "editado" });
    expect(listo.plan.medicamentos).toEqual([
      { medicamento: "Paracetamol", dosis: null, via: null, frecuencia: "cada 8 h", duracion: null, evidencia: null, origen: "manual" },
    ]);
  });

  it("sanea contenido mal formado sin fallar", () => {
    const c = completarContenido({ signos_vitales: { temperatura: { valor: "alta", estado: "medido" } }, otra: { x: 1 } });
    expect(c.signos_vitales.temperatura).toMatchObject({ valor: null, estado: "sin_informacion" });
    expect((c as Record<string, unknown>).otra).toBeUndefined();
  });

  it("resume los orígenes para la sección 09", () => {
    const c = contenidoVacio();
    c.motivo_padecimiento.motivo_consulta = { valor: "Dolor", estado: "referido", evidencia: null, origen: "ia" };
    c.motivo_padecimiento.padecimiento_actual = { valor: "Dolor", estado: "referido", evidencia: null, origen: "editado" };
    c.antecedentes.alergias = { valor: "Negadas", estado: "negado", evidencia: null, origen: "manual" };
    c.valoracion.diagnosticos = [{ descripcion: "Faringitis", condicion: "presuntivo", evidencia: null, origen: "ia" }];
    const r = resumirContenido(c);
    expect(r).toMatchObject({ iaSinCambios: 2, editados: 1, manuales: 1 });
    expect(r.vacios).toBe(27 - 4); // 27 campos guardados; una lista vacía cuenta como un campo vacío
  });
});
