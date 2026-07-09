import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "./paymentService";
import { httpClient } from "../lib/httpClient";
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusDto,
} from "../types/api";

// Mocka a camada HTTP inteira — nenhum request de rede real é feito.
vi.mock("../lib/httpClient", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Helper para montar o envelope Result<T> real do backend (.NET).
function envelope<T>(value: T) {
  return {
    data: {
      value,
      hasSuccess: true,
      count: 1,
      message: null,
      errors: [],
    },
  };
}

const mockedPost = vi.mocked(httpClient.post);
const mockedGet = vi.mocked(httpClient.get);

describe("PaymentService.createPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const request: CreatePaymentRequest = {
    orderId: "order-123",
    amount: 199.9,
    paymentMethod: "card",
    customerName: "Fulano de Tal",
    customerEmail: "fulano@example.com",
  };

  const responseValue: CreatePaymentResponse = {
    paymentId: "pay-abc",
    status: "pending",
    amount: 199.9,
    devMode: false,
    clientSecret: "pi_123_secret_xyz",
  };

  it("faz POST em /payment/create com o body correto", async () => {
    mockedPost.mockResolvedValueOnce(envelope(responseValue));

    await PaymentService.createPayment(request);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith("/payment/create", request);
  });

  it("retorna response.data.value (incluindo clientSecret)", async () => {
    mockedPost.mockResolvedValueOnce(envelope(responseValue));

    const result = await PaymentService.createPayment(request);

    expect(result).toEqual(responseValue);
    expect(result.clientSecret).toBe("pi_123_secret_xyz");
    expect(result.paymentId).toBe("pay-abc");
  });

  // REGRESSÃO (bug do envelope corrigido na Fase 0): o service DEVE ler `.value`,
  // e NÃO `.data`. Se alguém voltar a ler `response.data.data`, este teste quebra.
  it("REGRESSÃO: lê .value e não .data do envelope", async () => {
    // `data` (legado) tem conteúdo DIFERENTE de `value`. O correto é `value`.
    mockedPost.mockResolvedValueOnce({
      data: {
        value: responseValue,
        data: { paymentId: "WRONG", clientSecret: "WRONG_SECRET" },
        hasSuccess: true,
      },
    });

    const result = await PaymentService.createPayment(request);

    expect(result).toEqual(responseValue);
    expect(result.paymentId).not.toBe("WRONG");
    expect(result.clientSecret).not.toBe("WRONG_SECRET");
  });
});

describe("PaymentService.getPaymentStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const statusValue: PaymentStatusDto = {
    paymentId: "pay-abc",
    status: "approved",
    paymentMethod: "card",
    amount: 199.9,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("faz GET em /payment/{id}/status e retorna response.data.value", async () => {
    mockedGet.mockResolvedValueOnce(envelope(statusValue));

    const result = await PaymentService.getPaymentStatus("pay-abc");

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith("/payment/pay-abc/status");
    expect(result).toEqual(statusValue);
    expect(result.status).toBe("approved");
  });
});

describe("PaymentService.cancelPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz POST em /payment/{id}/cancel com { reason } e retorna response.data.value", async () => {
    mockedPost.mockResolvedValueOnce(envelope(true));

    const result = await PaymentService.cancelPayment("pay-abc", "cliente desistiu");

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith("/payment/pay-abc/cancel", {
      reason: "cliente desistiu",
    });
    expect(result).toBe(true);
  });

  it("envia { reason: undefined } quando reason é omitido", async () => {
    mockedPost.mockResolvedValueOnce(envelope(true));

    await PaymentService.cancelPayment("pay-abc");

    expect(mockedPost).toHaveBeenCalledWith("/payment/pay-abc/cancel", {
      reason: undefined,
    });
  });
});
