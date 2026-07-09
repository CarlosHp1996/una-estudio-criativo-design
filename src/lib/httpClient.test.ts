import { describe, it, expect, beforeEach } from "vitest";
import { tokenManager } from "./httpClient";

// Testa o tokenManager usando o localStorage real do jsdom.
// REGRESSÃO da unificação de token da Fase 0: a chave DEVE ser "una_token".
describe("tokenManager (chave 'una_token')", () => {
  beforeEach(() => {
    localStorage.clear();
    // limpa cookies do jsdom
    document.cookie
      .split(";")
      .forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
  });

  it("setToken grava o token na chave 'una_token' do localStorage", () => {
    tokenManager.setToken("meu-token-jwt");

    expect(localStorage.getItem("una_token")).toBe("meu-token-jwt");
    // Não deve gravar em chaves legadas.
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("getToken lê o token da chave 'una_token' do localStorage", () => {
    localStorage.setItem("una_token", "token-do-storage");

    expect(tokenManager.getToken()).toBe("token-do-storage");
  });

  it("getToken retorna null quando não há token", () => {
    expect(tokenManager.getToken()).toBeNull();
  });

  it("removeToken limpa 'una_token' e 'una_user' do localStorage", () => {
    localStorage.setItem("una_token", "t");
    localStorage.setItem("una_user", JSON.stringify({ id: "1" }));

    tokenManager.removeToken();

    expect(localStorage.getItem("una_token")).toBeNull();
    expect(localStorage.getItem("una_user")).toBeNull();
    expect(tokenManager.getToken()).toBeNull();
  });
});

describe("tokenManager.isTokenExpired", () => {
  // Monta um JWT (só a parte do payload importa aqui) com exp no futuro/passado.
  function fakeJwt(expSeconds: number): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ exp: expSeconds }));
    return `${header}.${payload}.assinatura`;
  }

  it("retorna false para token com exp no futuro", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(tokenManager.isTokenExpired(fakeJwt(future))).toBe(false);
  });

  it("retorna true para token com exp no passado", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    expect(tokenManager.isTokenExpired(fakeJwt(past))).toBe(true);
  });

  it("retorna true para token malformado", () => {
    expect(tokenManager.isTokenExpired("nao-e-um-jwt")).toBe(true);
  });
});
