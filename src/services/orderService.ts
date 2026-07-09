import { httpClient } from "../lib/httpClient";
import {
  Order,
  CreateOrderApiRequest,
  CreatedOrder,
  OrdersResponse,
  ApiResponse,
} from "../types/api";
import { parseApiError } from "../lib/errorHandling";
import { mapOrderDto, type BackendOrderDto } from "../lib/orderMapper";

/**
 * OrderService — service de pedidos do usuario (checkout + dashboard).
 *
 * Rotas REAIS do backend (OrderController — prefixos "api/Order" e "api/orders"):
 *   POST   /orders/create        -> cria pedido (CreateOrderRequest) -> value = CreateOrderResponse
 *   GET    /orders/get           -> lista paginada (GetOrdersRequestFilter) -> value = { orders, pagination }
 *   GET    /orders/get/{id}      -> pedido por id -> value = { order }
 *   PUT    /orders/update/{id}   -> atualiza Status / PaymentStatus / IsActive
 *   DELETE /orders/delete/{id}   -> remove pedido (hard delete, restaura estoque)
 *   GET    /orders/statistics    -> estatisticas (escopadas ao usuario logado quando nao-admin)
 *
 * NAO existem no backend: busca de pedido por numero e timeline/tracking de pedido.
 * Mesmo padrao/estilo de mapeamento usado em adminOrderService.ts.
 */

// Formato real do envelope `.value` de GET /orders/get.
interface BackendOrdersValue {
  orders: BackendOrderDto[];
  pagination: {
    currentPage?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  };
  addresses?: unknown;
}

// Formato real do `.value` de POST /orders/create (CreateOrderResponse).
interface BackendCreateOrderValue {
  orderId: string;
  totalAmount: number;
  status: string | number;
  paymentStatus: string | number;
  orderDate: string;
  orderNumber: number;
  isActive?: boolean;
}

export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export class OrderService {
  private static readonly BASE_PATH = "/orders";

  /**
   * Cria um novo pedido.
   * Rota real: POST /orders/create
   * Body real: { userId, addressId, paymentMethod, items:[{productId, quantity}] }.
   * `.value` = CreateOrderResponse -> mapeado para CreatedOrder (orderId -> id).
   */
  static async createOrder(
    request: CreateOrderApiRequest
  ): Promise<CreatedOrder> {
    try {
      const response = await httpClient.post<
        ApiResponse<BackendCreateOrderValue>
      >(`${this.BASE_PATH}/create`, request);

      const value = response.data.value;
      return {
        id: value.orderId,
        orderNumber: String(value.orderNumber),
        totalAmount: value.totalAmount,
        status: value.status,
        paymentStatus: value.paymentStatus,
        orderDate: value.orderDate,
        isActive: value.isActive,
      };
    } catch (error: any) {
      console.error("OrderService.createOrder failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Lista o historico de pedidos com paginacao.
   * Rota real: GET /orders/get  (envelope .value = { orders, pagination }).
   * Mapeia para o contrato OrdersResponse ({ items, currentPage, ... }),
   * igual adminOrderService.getAllOrders.
   */
  static async getOrders(
    page: number = 1,
    pageSize: number = 10,
    status?: Order["status"]
  ): Promise<OrdersResponse> {
    try {
      const params = new URLSearchParams();
      params.append("Page", page.toString());
      params.append("PageSize", pageSize.toString());
      if (status) params.append("Status", status);

      const response = await httpClient.get<ApiResponse<BackendOrdersValue>>(
        `${this.BASE_PATH}/get?${params.toString()}`
      );

      const value = response.data.value;
      return {
        items: (value?.orders ?? []).map(mapOrderDto),
        currentPage: value?.pagination?.currentPage ?? page,
        totalPages: value?.pagination?.totalPages ?? 1,
        totalItems: value?.pagination?.totalItems ?? 0,
        pageSize: value?.pagination?.pageSize ?? pageSize,
      };
    } catch (error: any) {
      console.error("OrderService.getOrders failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Busca um pedido pelo id.
   * Rota real: GET /orders/get/{id}  (envelope .value = { order }).
   */
  static async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await httpClient.get<
        ApiResponse<{ order: BackendOrderDto }>
      >(`${this.BASE_PATH}/get/${orderId}`);
      return mapOrderDto(response.data.value.order);
    } catch (error: any) {
      console.error("OrderService.getOrderById failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Cancela um pedido.
   * Rota real: DELETE /orders/delete/{id}. ATENCAO: no backend isso e um
   * HARD DELETE (remove o registro e devolve o estoque) — nao ha status
   * "cancelado" persistido. Retorna void; a UI deve tratar localmente.
   */
  static async cancelOrder(orderId: string): Promise<void> {
    try {
      await httpClient.delete<ApiResponse<unknown>>(
        `${this.BASE_PATH}/delete/${orderId}`
      );
    } catch (error: any) {
      console.error("OrderService.cancelOrder failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Atualiza o status de um pedido (admin).
   * Rota real: PUT /orders/update/{id}  (UpdateOrderRequest aceita Status).
   */
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<void> {
    try {
      await httpClient.put<ApiResponse<unknown>>(
        `${this.BASE_PATH}/update/${orderId}`,
        { status }
      );
    } catch (error: any) {
      console.error("OrderService.updateOrderStatus failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Estatisticas de pedidos para o dashboard.
   * Rota real: GET /orders/statistics  (.value = OrderStatisticsResponse).
   */
  static async getOrderStatistics(): Promise<OrderStatistics> {
    try {
      const response = await httpClient.get<ApiResponse<OrderStatistics>>(
        `${this.BASE_PATH}/statistics`
      );
      return response.data.value;
    } catch (error: any) {
      console.error("OrderService.getOrderStatistics failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Busca de pedido por numero.
   * TODO backend: endpoint inexistente — o OrderController nao expoe busca por numero.
   */
  static async getOrderByNumber(_orderNumber: string): Promise<Order> {
    void _orderNumber;
    throw new Error("Busca de pedido por numero nao implementada no backend");
  }

  /**
   * Timeline/rastreamento de status do pedido.
   * TODO backend: endpoint inexistente — o OrderController nao expoe tracking de pedido.
   */
  static async getOrderTracking(_orderId: string): Promise<any[]> {
    void _orderId;
    throw new Error("Tracking de pedido nao implementado no backend");
  }
}
