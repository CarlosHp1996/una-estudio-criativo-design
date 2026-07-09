import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthService } from "./authService";

// authService.login usa `fetch` (hardcoded), não o httpClient. Mockamos o fetch global.
// Este teste cobre o parse do envelope no login: token vem de `data.value.token` e as
// roles/claims são extraídas do JWT.

// Monta um JWT falso (só o payload importa para o decodeToken).
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.assinatura`;
}

describe("AuthService.login (parse do envelope)", () => {
  const token = fakeJwt({
    sub: "user-42",
    name: "Fulano",
    email: "fulano@example.com",
    role: "User",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ value: { token }, hasSuccess: true }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extrai o token de data.value.token e monta o AuthResponse", async () => {
    const result = await AuthService.login({
      email: "fulano@example.com",
      password: "senha123",
    });

    expect(result.token).toBe(token);
    expect(result.user.id).toBe("user-42");
    expect(result.user.email).toBe("fulano@example.com");
    expect(result.user.roles).toContain("User");
  });

  it("persiste o token em localStorage['una_token'] após login", async () => {
    await AuthService.login({ email: "fulano@example.com", password: "x" });

    expect(localStorage.getItem("una_token")).toBe(token);
    expect(localStorage.getItem("una_user")).not.toBeNull();
  });

  it("lança erro quando o backend não retorna token no envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ value: {}, hasSuccess: true }),
      })),
    );

    await expect(
      AuthService.login({ email: "a@b.com", password: "x" }),
    ).rejects.toThrow();
  });
});
