import { describe, it, expect } from "vitest";
import {
  BRAZIL_STATES,
  ufToEnumState,
  enumStateToUf,
} from "./brazilStates";

describe("brazilStates - mapeamento UF <-> EnumState", () => {
  it("a lista tem as 27 UFs na ordem do enum do backend (AC=0, SP=24, TO=26)", () => {
    expect(BRAZIL_STATES).toHaveLength(27);
    expect(BRAZIL_STATES[0]).toMatchObject({ uf: "AC", value: 0 });
    expect(BRAZIL_STATES[24]).toMatchObject({ uf: "SP", value: 24 });
    expect(BRAZIL_STATES[26]).toMatchObject({ uf: "TO", value: 26 });
  });

  it("ufToEnumState converte a sigla no valor inteiro correto", () => {
    expect(ufToEnumState("SP")).toBe(24);
    expect(ufToEnumState("AC")).toBe(0);
    expect(ufToEnumState("RJ")).toBe(18);
  });

  it("ufToEnumState é case-insensitive e ignora espaços", () => {
    expect(ufToEnumState("sp")).toBe(24);
    expect(ufToEnumState("  mg ")).toBe(12);
  });

  it("ufToEnumState retorna undefined para UF inválida/vazia", () => {
    expect(ufToEnumState("XX")).toBeUndefined();
    expect(ufToEnumState("")).toBeUndefined();
    expect(ufToEnumState(null)).toBeUndefined();
    expect(ufToEnumState(undefined)).toBeUndefined();
  });

  it("enumStateToUf tolera number, string numérica e sigla (backend serializa enum como string)", () => {
    expect(enumStateToUf(24)).toBe("SP");
    expect(enumStateToUf("24")).toBe("SP");
    expect(enumStateToUf("SP")).toBe("SP");
    expect(enumStateToUf("sp")).toBe("SP");
  });

  it("enumStateToUf retorna undefined para entradas inválidas", () => {
    expect(enumStateToUf(999)).toBeUndefined();
    expect(enumStateToUf("ZZ")).toBeUndefined();
    expect(enumStateToUf(null)).toBeUndefined();
    expect(enumStateToUf(undefined)).toBeUndefined();
  });
});
