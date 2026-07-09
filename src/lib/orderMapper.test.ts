import { describe, it, expect } from "vitest";
import { mapOrderDto, type BackendOrderDto } from "./orderMapper";

describe("mapOrderDto", () => {
  it("normaliza orderNumber (int) -> string e orderDate -> createdAt", () => {
    const dto: BackendOrderDto = {
      id: "order-1",
      orderNumber: 42,
      status: "pending",
      paymentStatus: "paid",
      totalAmount: 199.9,
      orderDate: "2026-01-15T10:00:00Z",
      items: [],
    };

    const order = mapOrderDto(dto);

    expect(order.orderNumber).toBe("42");
    expect(typeof order.orderNumber).toBe("string");
    expect(order.createdAt).toBe("2026-01-15T10:00:00Z");
    expect(order.totalAmount).toBe(199.9);
  });

  it("garante status/paymentStatus minusculos e tolera enum como int", () => {
    const asString = mapOrderDto({
      status: "Shipped",
      paymentStatus: "Approved",
    });
    expect(asString.status).toBe("shipped");
    expect(asString.paymentStatus).toBe("approved");

    // Fallback legado: enum como int (EnumOrderStatus: 0..4 / EnumPaymentStatus).
    const asInt = mapOrderDto({ status: 2, paymentStatus: 2 });
    expect(asInt.status).toBe("shipped");
    expect(asInt.paymentStatus).toBe("paid");
  });

  it("monta shippingAddress a partir do endereco principal (mainAddress) com UF", () => {
    const dto: BackendOrderDto = {
      id: "order-2",
      addresses: [
        {
          street: "Rua A",
          city: "Rio de Janeiro",
          state: "RJ",
          zipCode: "20000-000",
          mainAddress: false,
        },
        {
          street: "Av. Paulista, 1000",
          city: "São Paulo",
          state: 24, // EnumState.SP como int -> deve virar "SP"
          zipCode: "01310-100",
          mainAddress: true,
        },
      ],
    };

    const order = mapOrderDto(dto);

    expect(order.shippingAddress.street).toBe("Av. Paulista, 1000");
    expect(order.shippingAddress.city).toBe("São Paulo");
    expect(order.shippingAddress.state).toBe("SP");
    expect(order.shippingAddress.zipCode).toBe("01310-100");
    expect(order.shippingAddress.country).toBe("Brasil");
  });

  it("mapeia itens (OrderItemDto -> OrderItem) derivando subtotal de totalPrice", () => {
    const dto: BackendOrderDto = {
      id: "order-3",
      items: [
        {
          productId: "prod-1",
          productName: "Caneca",
          quantity: 3,
          unitPrice: 25,
          totalPrice: 75,
        },
      ],
    };

    const order = mapOrderDto(dto);

    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toEqual({
      productId: "prod-1",
      productName: "Caneca",
      quantity: 3,
      unitPrice: 25,
      subtotal: 75,
    });
  });

  it("usa defaults seguros quando o pedido vem sem addresses/items", () => {
    const order = mapOrderDto({ id: "order-4", orderNumber: 7 });

    expect(order.items).toEqual([]);
    expect(order.shippingAddress).toEqual({
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Brasil",
    });
  });
});
