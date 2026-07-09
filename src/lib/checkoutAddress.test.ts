import { describe, it, expect } from "vitest";
import {
  EMPTY_GUID,
  buildAddressesPayload,
  resolveNewAddressId,
  formatAddressLine,
} from "./checkoutAddress";
import type { AddressDto } from "@/types/api";

const existingAddress: AddressDto = {
  id: "11111111-1111-1111-1111-111111111111",
  street: "Rua A",
  number: "10",
  neighborhood: "Centro",
  city: "São Paulo",
  state: 24,
  zipCode: "01000-000",
  mainAddress: true,
};

const newAddress: AddressDto = {
  street: "Rua B",
  number: "20",
  neighborhood: "Jardim",
  city: "Campinas",
  state: 24,
  zipCode: "13000-000",
  mainAddress: false,
};

describe("buildAddressesPayload", () => {
  it("reenvia os endereços existentes (com Id) e anexa o novo com Guid.Empty", () => {
    const payload = buildAddressesPayload([existingAddress], newAddress);

    expect(payload).toHaveLength(2);
    // Existente preservado com seu Id.
    expect(payload[0].id).toBe(existingAddress.id);
    expect(payload[0].street).toBe("Rua A");
    // Novo endereço vai com Guid.Empty (backend só cria quando Id == Guid.Empty).
    expect(payload[1].id).toBe(EMPTY_GUID);
    expect(payload[1].street).toBe("Rua B");
  });

  it("quando não há endereços existentes, envia só o novo com Guid.Empty", () => {
    const payload = buildAddressesPayload([], newAddress);
    expect(payload).toHaveLength(1);
    expect(payload[0].id).toBe(EMPTY_GUID);
  });

  it("descarta entradas existentes sem Id ou com Guid.Empty (não são endereços salvos)", () => {
    const bogus = { ...newAddress, id: EMPTY_GUID };
    const payload = buildAddressesPayload([bogus], newAddress);
    // O bogus não é reenviado; só o novo permanece.
    expect(payload).toHaveLength(1);
    expect(payload[0].id).toBe(EMPTY_GUID);
  });
});

describe("resolveNewAddressId", () => {
  it("identifica o Id que não existia antes do update", () => {
    const returned = [
      { id: "11111111-1111-1111-1111-111111111111" },
      { id: "22222222-2222-2222-2222-222222222222" }, // novo
    ];
    const newId = resolveNewAddressId(
      ["11111111-1111-1111-1111-111111111111"],
      returned
    );
    expect(newId).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("quando não havia endereços, retorna o único Id retornado", () => {
    const returned = [{ id: "33333333-3333-3333-3333-333333333333" }];
    expect(resolveNewAddressId([], returned)).toBe(
      "33333333-3333-3333-3333-333333333333"
    );
  });

  it("retorna undefined quando nenhum Id novo aparece", () => {
    const returned = [{ id: "11111111-1111-1111-1111-111111111111" }];
    expect(
      resolveNewAddressId(["11111111-1111-1111-1111-111111111111"], returned)
    ).toBeUndefined();
  });

  it("ignora Guid.Empty na lista retornada", () => {
    const returned = [{ id: EMPTY_GUID }];
    expect(resolveNewAddressId([], returned)).toBeUndefined();
  });
});

describe("formatAddressLine", () => {
  it("formata rua, número, cidade e UF de forma legível", () => {
    const line = formatAddressLine(existingAddress);
    expect(line).toContain("Rua A, 10");
    expect(line).toContain("São Paulo - SP");
    expect(line).toContain("CEP 01000-000");
  });

  it("tolera state vindo como string do backend (JsonStringEnumConverter)", () => {
    const line = formatAddressLine({
      ...existingAddress,
      state: "SP" as unknown as number,
    });
    expect(line).toContain("São Paulo - SP");
  });
});
