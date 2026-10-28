import { describe, expect, it } from "vitest";
import { alertasDeAlergia, alertasQueBloquean, calcularAlertas } from "@/lib/alertas";
import { contenidoVacio } from "@/lib/contenido";

const rx = (medicamento: string) => ({ medicamento, dosis: null, via: null, frecuencia: null, duracion: null, evidencia: null });

describe("alertas", () => {
  it("detecta un medicamento del grupo de una alergia registrada", () => {
    const a = alertasDeAlergia([rx("Paracetamol"), rx("Amoxicilina con ácido clavulánico")], ["Penicilina (urticaria generalizada)"]);
    expect(a).toHaveLength(1);
    expect(a[0].campo).toBe("plan.medicamentos[1]");
    expect(alertasDeAlergia([rx("Amoxicilina")], ["Sin alergias conocidas"])).toHaveLength(0);
    expect(alertasDeAlergia([rx("Ibuprofeno")], ["Contaminantes"])).toHaveLength(0);
  });

  it("recalcula los signos vitales y respeta las alertas resueltas", () => {
    const c = contenidoVacio();
    c.signos_vitales.talla = { valor: 1.62, unidad: "cm", estado: "medido", evidencia: null };
    const alertas = calcularAlertas({
      contenido: c,
      alertasIa: [
        { tipo: "paciente_no_coincide", severidad: "critica", campo: null, mensaje: "Otro paciente", bloquea: true },
        { tipo: "fuera_de_rango", severidad: "advertencia", campo: "signos_vitales.temperatura", mensaje: "x", bloquea: false },
      ],
      resueltas: ["paciente_no_coincide"],
      alergiasPaciente: null,
      esMenor: false,
    });
    expect(alertas.map((a) => a.tipo)).toEqual(["paciente_no_coincide", "valor_imposible"]);
    expect(alertasQueBloquean(alertas).map((a) => a.id)).toEqual(["valor_imposible:signos_vitales.talla"]);
  });
});
