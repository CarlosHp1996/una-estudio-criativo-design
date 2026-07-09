import { httpClient } from "../lib/httpClient";
import { Order, OrdersResponse, ApiResponse } from "../types/api";

/**
 * AdminOrderService
 *
 * Rotas REAIS do backend (OrderController — prefixos "api/Order" e "api/orders"):
 *   GET    /orders/get            -> lista paginada (GetOrdersRequestFilter)
 *   GET    /orders/get/{id}       -> pedido por id
 *   PUT    /orders/update/{id}    -> atualiza Status / PaymentStatus / IsActive
 *   DELETE /orders/delete/{id}    -> remove pedido
 *   POST   /orders/{id}/checkout  -> checkout/pagamento
 *   GET    /orders/statistics     -> estatisticas
 *
 * NAO existem no backend: busca textual de pedidos, atualizacao/exclusao em lote,
 * exportacao, criacao manual e historico/timeline. Ver metodos marcados abaixo.
 */

// Formato real do envelope `.value` retornado por GET /orders/get.
interface BackendOrdersValue {
  orders: Order[];
  pagination: {
    currentPage?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  };
  addresses?: unknown;
}

// Formato real do `.value` de GET /orders/statistics (OrderStatisticsResponse).
export interface AdminOrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export class AdminOrderService {
  private static readonly BASE_PATH = "/orders";

  /**
   * Lista pedidos com paginacao/filtros.
   * Rota real: GET /orders/get
   */
  static async getAllOrders(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      search?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      userId?: string;
    }
  ): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("Page", page.toString());
    queryParams.append("PageSize", pageSize.toString());

    // NOTE: o backend NAO possui busca textual de pedidos
    // (GetOrdersRequestFilter nao tem campo Search). `filters.search` e
    // intencionalmente ignorado para nao enviar um parametro fantasma.
    if (filters?.status) queryParams.append("Status", filters.status);
    if (filters?.startDate) queryParams.append("StartDate", filters.startDate);
    if (filters?.endDate) queryParams.append("EndDate", filters.endDate);
    if (filters?.userId) queryParams.append("UserId", filters.userId);

    const response = await httpClient.get<ApiResponse<BackendOrdersValue>>(
      `${this.BASE_PATH}/get?${queryParams.toString()}`
    );

    const value = response.data.value;
    // Mapeia o formato do backend ({ orders, pagination }) para o contrato
    // OrdersResponse ({ items, currentPage, totalPages, totalItems, pageSize })
    // esperado pelas paginas admin.
    return {
      items: value?.orders ?? [],
      currentPage: value?.pagination?.currentPage ?? page,
      totalPages: value?.pagination?.totalPages ?? 1,
      totalItems: value?.pagination?.totalItems ?? 0,
      pageSize: value?.pagination?.pageSize ?? pageSize,
    };
  }

  /**
   * Busca um pedido pelo id (visao admin).
   * Rota real: GET /orders/get/{id}  (envelope .value = { order })
   */
  static async getOrderById(id: string): Promise<Order> {
    const response = await httpClient.get<ApiResponse<{ order: Order }>>(
      `${this.BASE_PATH}/get/${id}`
    );
    return response.data.value.order;
  }

  /**
   * Atualiza o status de um pedido.
   * Rota real: PUT /orders/update/{id}  (UpdateOrderRequest aceita Status)
   */
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<void> {
    await httpClient.put<ApiResponse<unknown>>(
      `${this.BASE_PATH}/update/${orderId}`,
      { status }
    );
  }

  /**
   * Atualiza o status de varios pedidos.
   * O backend NAO tem endpoint em lote — reaproveitamos a rota real de update
   * (PUT /orders/update/{id}) aplicando o status pedido a pedido.
   */
  static async bulkUpdateOrderStatus(
    orderIds: string[],
    status: Order["status"]
  ): Promise<void> {
    await Promise.all(orderIds.map((id) => this.updateOrderStatus(id, status)));
  }

  /**
   * Estatisticas de pedidos para o dashboard admin.
   * Rota real: GET /orders/statistics
   * (nao aceita intervalo de datas — parametros mantidos apenas para
   * compatibilidade de chamada e sao ignorados).
   */
  static async getOrderStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<AdminOrderStatistics> {
    void startDate;
    void endDate;
    const response = await httpClient.get<ApiResponse<AdminOrderStatistics>>(
      `${this.BASE_PATH}/statistics`
    );
    return response.data.value;
  }

  /**
   * Exportacao de pedidos (CSV/Excel).
   * TODO backend: endpoint inexistente — nao ha rota de exportacao de pedidos.
   * Mantido com a assinatura original para nao quebrar chamadas existentes;
   * a pagina que consome trata o erro via toast.
   */
  static async exportOrders(
    format: "csv" | "excel" = "csv",
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<Blob> {
    void format;
    void filters;
    throw new Error("Exportacao de pedidos nao implementada no backend");
  }
}
