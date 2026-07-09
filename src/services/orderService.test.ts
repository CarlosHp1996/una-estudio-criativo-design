import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderService } from "./orderService";
import { httpClient } from "../lib/httpClient";
import type { CreateOrderRequest, Order } from "../types/api";

vi.mock("../lib/httpClient", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedPost = vi.mocked(httpClient.post);

const request: CreateOrderRequest = {
  shippingAddress: {
    street: "Rua das Flores, 100",
    city: "São Paulo",
    state: "SP",
    zipCode: "01000-000",
    country: "BR",
  },
  paymentMethod: "card",
  notes: "Entregar de manhã",
};

const orderValue: Order = {
  id: "order-1",
  orderNumber: "UNA-0001",
  status: "pending",
  totalAmount: 199.9,
  items: [],
  shippingAddress: request.shippingAddress,
  paymentStatus: "pending",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("OrderService.createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz POST em /orders com o body correto", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { value: orderValue, hasSuccess: true },
    });

    await OrderService.createOrder(request);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith("/orders", request);
  });

  it("retorna response.data.value", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { value: orderValue, hasSuccess: true },
    });

    const result = await OrderService.createOrder(request);

    expect(result).toEqual(orderValue);
    expect(result.orderNumber).toBe("UNA-0001");
  });

  // REGRESSÃO do envelope (Fase 0): createOrder deve ler `.value`, não `.data`.
  it("REGRESSÃO: lê .value e não .data do envelope", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        value: orderValue,
        data: { id: "WRONG", orderNumber: "WRONG" },
        hasSuccess: true,
      },
    });

    const result = await OrderService.createOrder(request);

    expect(result).toEqual(orderValue);
    expect(result.id).not.toBe("WRONG");
  });
});
