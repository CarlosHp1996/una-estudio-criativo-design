import { describe, it, expect, vi, beforeEach } from "vitest";

// authService agora usa o httpClient (apiUtils), não `fetch` hardcoded.
// Mockamos apenas o `apiUtils` do módulo, preservando o `tokenManager` real
// (login/decode dependem de decodeToken + setToken de verdade).
vi.mock("@/lib/httpClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/httpClient")>();
  return {
    ...actual,
    apiUtils: {
      ...actual.apiUtils,
      post: vi.fn(),
    },
  };
});

import { AuthService } from "./authService";
import { apiUtils } from "@/lib/httpClient";

const mockedPost = vi.mocked(apiUtils.post);

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
    mockedPost.mockReset();
    // Envelope Result<T>: o token vem em data.value.token.
    mockedPost.mockResolvedValue({ value: { token }, hasSuccess: true });
  });

  it("extrai o token de data.value.token e monta o AuthResponse", async () => {
    const result = await AuthService.login({
      email: "fulano@example.com",
      password: "senha123",
    });

    expect(mockedPost).toHaveBeenCalledWith("/Auth/login", {
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
    mockedPost.mockResolvedValue({ value: {}, hasSuccess: true });

    await expect(
      AuthService.login({ email: "a@b.com", password: "x" }),
    ).rejects.toThrow();
  });
});
