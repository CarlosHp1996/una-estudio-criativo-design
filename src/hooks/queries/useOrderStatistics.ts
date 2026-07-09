import { useQuery } from "@tanstack/react-query";
import { OrderService, type OrderStatistics } from "@/services/orderService";
import { queryKeys } from "./queryKeys";

/**
 * Estatisticas de pedidos do usuario (cards do dashboard).
 */
export function useOrderStatistics() {
  return useQuery<OrderStatistics>({
    queryKey: queryKeys.orders.statistics(),
    queryFn: () => OrderService.getOrderStatistics(),
  });
}
