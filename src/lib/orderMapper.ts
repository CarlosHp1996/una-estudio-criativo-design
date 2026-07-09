import { enumStateToUf } from "./brazilStates";
import type { Order, OrderItem, ShippingAddress } from "@/types/api";

/**
 * orderMapper — normaliza o OrderDto cru do backend para o tipo `Order` do frontend.
 *
 * Por que existe: o backend (UnaProject.Application.Models.Dtos.OrderDto) devolve
 * o pedido num shape que NAO bate 1:1 com o `Order` que a UI consome:
 *   - `orderNumber` e int  -> a UI espera string ("#123").
 *   - `orderDate` (nao `createdAt`) -> a UI usa `createdAt`.
 *   - `status`/`paymentStatus` chegam como enum string minusculo
 *     (pending/processing/shipped/...) por causa do LowerCaseEnumConverter; ainda
 *     assim garantimos minuscula e toleramos int (fluxos legados).
 *   - `addresses` (lista de AddressDto) -> a UI usa um unico `shippingAddress`;
 *     escolhemos o endereco principal (mainAddress) ou o primeiro.
 *   - itens vem como OrderItemDto (productName/unitPrice/totalPrice) -> mapeamos
 *     para OrderItem (subtotal).
 *
 * Aplicado em orderService e adminOrderService (getOrders/getAllOrders/getOrderById).
 */

// Ordem dos enums do backend (EnumOrderStatus / EnumPaymentStatus). Usada apenas
// como fallback quando o backend manda int em vez da string minuscula.
const ORDER_STATUS = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const PAYMENT_STATUS = [
  "pending",
  "approved",
  "paid",
  "failed",
  "cancelled",
  "refunded",
] as const;

// Shapes "frouxos" do backend — todos os campos opcionais para tolerar variacoes
// entre GetAllOrders (lista) e GetOrderById (detalhe) e envelopes antigos.
export interface BackendOrderItemDto {
  id?: string;
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  subtotal?: number;
}

export interface BackendAddressDto {
  id?: string;
  street?: string;
  completName?: string;
  city?: string;
  state?: number | string | null;
  zipCode?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  mainAddress?: boolean | null;
  country?: string;
}

export interface BackendOrderDto {
  id?: string;
  orderNumber?: number | string;
  status?: string | number;
  paymentStatus?: string | number;
  totalAmount?: number;
  orderDate?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentMethod?: string;
  items?: BackendOrderItemDto[];
  addresses?: BackendAddressDto[] | null;
  // Campos que hoje o backend nao devolve, mas a UI admin usa se existirem.
  trackingCode?: string;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  transactionId?: string;
}

/**
 * Normaliza um valor de enum vindo como string minuscula (contrato atual) ou como
 * int (fallback legado) para a string minuscula esperada pela UI.
 */
function normalizeEnum(
  value: string | number | undefined | null,
  byIndex: readonly string[],
  fallback: string
): string {
  if (typeof value === "number") return byIndex[value] ?? fallback;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    return lower.length > 0 ? lower : fallback;
  }
  return fallback;
}

function mapItem(item: BackendOrderItemDto): OrderItem {
  const quantity = item.quantity ?? 0;
  const unitPrice = item.unitPrice ?? 0;
  const subtotal = item.subtotal ?? item.totalPrice ?? unitPrice * quantity;
  return {
    productId: item.productId ?? "",
    productName: item.productName ?? "",
    quantity,
    unitPrice,
    subtotal,
  };
}

/**
 * Monta o `shippingAddress` unico a partir da lista `addresses` do backend.
 * Prioriza o endereco marcado como principal; senao usa o primeiro. Converte o
 * `state` (EnumState — string "SP" ou int) para a sigla da UF.
 */
function mapShippingAddress(
  addresses: BackendAddressDto[] | null | undefined
): ShippingAddress {
  const list = addresses ?? [];
  const main = list.find((a) => a.mainAddress) ?? list[0];

  if (!main) {
    return { street: "", city: "", state: "", zipCode: "", country: "Brasil" };
  }

  const uf = enumStateToUf(main.state ?? undefined);

  return {
    street: main.street ?? "",
    city: main.city ?? "",
    state: uf ?? (main.state != null ? String(main.state) : ""),
    zipCode: main.zipCode ?? "",
    country: main.country ?? "Brasil",
  };
}

/**
 * Converte o OrderDto cru do backend no `Order` normalizado do frontend.
 */
export function mapOrderDto(dto: BackendOrderDto): Order {
  return {
    id: dto.id ?? "",
    orderNumber: dto.orderNumber != null ? String(dto.orderNumber) : "",
    status: normalizeEnum(dto.status, ORDER_STATUS, "pending") as Order["status"],
    paymentStatus: normalizeEnum(
      dto.paymentStatus,
      PAYMENT_STATUS,
      "pending"
    ) as Order["paymentStatus"],
    totalAmount: dto.totalAmount ?? 0,
    items: (dto.items ?? []).map(mapItem),
    shippingAddress: mapShippingAddress(dto.addresses),
    createdAt: dto.orderDate ?? dto.createdAt ?? "",
    updatedAt: dto.updatedAt,
    paymentMethod: dto.paymentMethod,
    trackingCode: dto.trackingCode,
    subtotal: dto.subtotal,
    shippingCost: dto.shippingCost,
    tax: dto.tax,
    transactionId: dto.transactionId,
  };
}
