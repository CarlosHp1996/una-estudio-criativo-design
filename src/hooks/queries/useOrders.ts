import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { OrderService } from "@/services/orderService";
import type { Order, OrdersResponse } from "@/types/api";
import { queryKeys } from "./queryKeys";

/**
 * Lista paginada de pedidos do usuario logado. Usado no dashboard
 * (pedidos recentes) e no historico de pedidos.
 */
export function useOrders(
  page: number = 1,
  pageSize: number = 10,
  status?: Order["status"],
) {
  return useQuery<OrdersResponse>({
    queryKey: queryKeys.orders.list(page, pageSize, status),
    queryFn: () => OrderService.getOrders(page, pageSize, status),
    placeholderData: keepPreviousData,
  });
}
