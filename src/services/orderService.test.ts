import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderService } from "./orderService";
import { httpClient } from "../lib/httpClient";
import type { CreateOrderApiRequest, Order } from "../types/api";

vi.mock("../lib/httpClient", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedPost = vi.mocked(httpClient.post);
const mockedGet = vi.mocked(httpClient.get);
const mockedDelete = vi.mocked(httpClient.delete);

// Body no shape REAL do backend (CreateOrderRequest.cs).
const request: CreateOrderApiRequest = {
  userId: "user-1",
  addressId: "addr-1",
  paymentMethod: "card",
  items: [{ productId: "prod-1", quantity: 2 }],
};

// `.value` real de POST /orders/create (CreateOrderResponse): usa `orderId`
// (nao `id`) e `orderNumber` como int.
const createOrderValue = {
  orderId: "order-1",
  totalAmount: 199.9,
  status: 0,
  paymentStatus: 0,
  orderDate: "2026-01-01T00:00:00Z",
  orderNumber: 1,
  isActive: true,
};

describe("OrderService.createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz POST em /orders/create com o body correto", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { value: createOrderValue, hasSuccess: true },
    });

    await OrderService.createOrder(request);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith("/orders/create", request);
  });

  it("mapeia orderId -> id e orderNumber (int) -> string", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { value: createOrderValue, hasSuccess: true },
    });

    const result = await OrderService.createOrder(request);

    expect(result.id).toBe("order-1");
    expect(result.orderNumber).toBe("1");
    expect(result.totalAmount).toBe(199.9);
  });

  // REGRESSÃO do envelope (Fase 0): createOrder deve ler `.value`, não `.data`.
  it("REGRESSÃO: lê .value e não .data do envelope", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        value: createOrderValue,
        data: { orderId: "WRONG", orderNumber: 999 },
        hasSuccess: true,
      },
    });

    const result = await OrderService.createOrder(request);

    expect(result.id).toBe("order-1");
    expect(result.id).not.toBe("WRONG");
  });
});

describe("OrderService.getOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const backendOrdersValue = {
    orders: [{ id: "order-1", orderNumber: 1 } as unknown as Order],
    pagination: {
      currentPage: 2,
      pageSize: 5,
      totalItems: 12,
      totalPages: 3,
    },
  };

  it("faz GET em /orders/get com Page/PageSize", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { value: backendOrdersValue, hasSuccess: true },
    });

    await OrderService.getOrders(2, 5);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith(
      "/orders/get?Page=2&PageSize=5"
    );
  });

  it("mapeia { orders, pagination } -> OrdersResponse { items, ... }", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { value: backendOrdersValue, hasSuccess: true },
    });

    const result = await OrderService.getOrders(2, 5);

    expect(result.items).toHaveLength(1);
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.totalItems).toBe(12);
    expect(result.pageSize).toBe(5);
  });

  // REGRESSÃO: envelope é lido de `.value` (não `.data`) e o value traz `orders`.
  it("REGRESSÃO: lê .value.orders e não .data", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        value: backendOrdersValue,
        data: { orders: [], pagination: {} },
        hasSuccess: true,
      },
    });

    const result = await OrderService.getOrders(2, 5);

    expect(result.items).toHaveLength(1);
  });
});

describe("OrderService.getOrderById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz GET em /orders/get/{id} e retorna value.order normalizado (mapOrderDto)", async () => {
    // Backend devolve orderNumber como int e orderDate; o mapper normaliza.
    const order = {
      id: "order-1",
      orderNumber: 1,
      status: "pending",
      orderDate: "2026-01-01T00:00:00Z",
    } as unknown as Order;
    mockedGet.mockResolvedValueOnce({
      data: { value: { order }, hasSuccess: true },
    });

    const result = await OrderService.getOrderById("order-1");

    expect(mockedGet).toHaveBeenCalledWith("/orders/get/order-1");
    expect(result.id).toBe("order-1");
    expect(result.orderNumber).toBe("1");
    expect(result.status).toBe("pending");
    expect(result.createdAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("OrderService.cancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz DELETE em /orders/delete/{id}", async () => {
    mockedDelete.mockResolvedValueOnce({
      data: { value: null, hasSuccess: true },
    });

    await OrderService.cancelOrder("order-1");

    expect(mockedDelete).toHaveBeenCalledTimes(1);
    expect(mockedDelete).toHaveBeenCalledWith("/orders/delete/order-1");
  });
});
