import type { ProductFilters, Order } from "@/types/api";

/**
 * Query keys centralizados do React Query.
 *
 * Manter as chaves aqui evita divergencia entre hooks e facilita invalidacao
 * futura (ex.: apos uma mutation de produto/pedido). Estrutura hierarquica:
 *   ["products", ...]  -> tudo relacionado a produtos
 *   ["orders", ...]    -> tudo relacionado a pedidos
 */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (page: number, pageSize: number, filters?: ProductFilters) =>
      [...queryKeys.products.lists(), { page, pageSize, filters: filters ?? {} }] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    recommendations: (productId: string, limit: number) =>
      [...queryKeys.products.all, "recommendations", productId, limit] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (page: number, pageSize: number, status?: Order["status"]) =>
      [...queryKeys.orders.lists(), { page, pageSize, status: status ?? null }] as const,
    statistics: () => [...queryKeys.orders.all, "statistics"] as const,
  },
} as const;
