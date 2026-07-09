import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderService } from "@/services/orderService";
import { AdminOrderService } from "@/services/adminOrderService";
import type { Order } from "@/types/api";
import { queryKeys } from "./queryKeys";

/**
 * Mutations de pedido via React Query.
 *
 * Envolvem os metodos de ESCRITA de OrderService/AdminOrderService e, no
 * onSuccess, invalidam `queryKeys.orders` (listas, detalhe e estatisticas) para
 * que consumidores de leitura via React Query refaçam o fetch sozinhos.
 * Toasts e acoes locais ficam no `mutate({...}, { onSuccess, onError })` da pagina.
 */

/**
 * Cancela um pedido do usuario. Rota real: DELETE /orders/delete/{id}
 * (hard delete no backend — devolve o estoque; a UI trata localmente).
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => OrderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Atualiza o status de um pedido (contexto do usuario).
 * Rota real: PUT /orders/update/{id}.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: Order["status"];
    }) => OrderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Atualiza o status de um pedido (painel admin).
 * Rota real: PUT /orders/update/{id} via AdminOrderService.
 */
export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: Order["status"];
    }) => AdminOrderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Atualiza o status de varios pedidos em lote (admin).
 * Reaproveita PUT /orders/update/{id} pedido a pedido (backend nao tem rota bulk).
 */
export function useBulkUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderIds,
      status,
    }: {
      orderIds: string[];
      status: Order["status"];
    }) => AdminOrderService.bulkUpdateOrderStatus(orderIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
