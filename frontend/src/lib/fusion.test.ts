import { describe, expect, it } from "vitest";
import type { RespuestaProcesar } from "@/api/tipos";
import { crearBorrador } from "@/lib/borrador";
import { fusionarRespuesta } from "@/lib/fusion";
import procesar from "@/mocks/procesar_faringitis.json";
import type { CampoTexto, CampoVital, Diagnostico } from "@/plantilla/valores";

const respuesta = procesar as unknown as RespuestaProcesar;

describe("fusión de la respuesta de la IA (§9)", () => {
  it("primer audio: copia los campos y marca origen ia solo en los que traen información", () => {
    const b = fusionarRespuesta(crearBorrador(1, true), respuesta, { modo: "consulta", consentimiento: true });
    const motivo = b.secciones.motivo_padecimiento.motivo_consulta as CampoTexto;
    expect(motivo.origen).toBe("ia");
    expect(motivo.valor).toBe("Me duele mucho la garganta y tengo calentura");
    const hf = b.secciones.antecedentes.heredofamiliares as CampoTexto;
    expect(hf.estado).toBe("sin_informacion");
    expect(hf.origen).toBeUndefined();
    expect((b.secciones.valoracion.diagnosticos as Diagnostico[])[0].origen).toBe("ia");
    expect(b.transcripcion.segmentos.every((s) => s.audio === 1)).toBe(true);
    expect(b.modo_captura).toBe("consulta");
    expect(b.consentimiento_grabacion).toBe(true);
    expect(b.alertas).toHaveLength(3);
  });

  it("audios siguientes: nunca sobrescriben y agregan renglones nuevos", () => {
    let b = crearBorrador(1, true);
    b.secciones.signos_vitales.temperatura = { valor: 37.2, unidad: "°C", estado: "medido", evidencia: null, origen: "manual" };
    b.secciones.antecedentes.alergias = { valor: null, estado: "sin_informacion", evidencia: null, origen: "editado" };
    b.secciones.valoracion.diagnosticos = [
      { descripcion: "Faringitis, probablemente viral", condicion: "confirmado", evidencia: null, origen: "manual" },
    ];
    b.alertas_resueltas = ["paciente_no_coincide"];
    b = fusionarRespuesta(b, respuesta, { modo: "dictado", consentimiento: false });
    expect((b.secciones.signos_vitales.temperatura as CampoVital).valor).toBe(37.2);
    // Lo que el médico borró a propósito no se vuelve a llenar.
    expect((b.secciones.antecedentes.alergias as CampoTexto).valor).toBeNull();
    // El diagnóstico repetido no se duplica.
    expect(b.secciones.valoracion.diagnosticos).toHaveLength(1);
    expect(b.alertas_resueltas).toEqual(["paciente_no_coincide"]);
    expect(b.modo_captura).toBe("dictado");

    const segundo = fusionarRespuesta(b, respuesta, { modo: "consulta", consentimiento: true });
    expect(segundo.transcripcion.segmentos.filter((s) => s.audio === 2)).toHaveLength(respuesta.transcripcion.segmentos.length);
    expect(segundo.transcripcion.texto.split("\n\n")).toHaveLength(2);
    expect(segundo.modo_captura).toBe("consulta");
  });
});
