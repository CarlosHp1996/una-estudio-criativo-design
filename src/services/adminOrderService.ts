import { httpClient } from "../lib/httpClient";
import {
  Order,
  OrdersResponse,
  ApiResponse,
  PaginationParams,
} from "../types/api";

export class AdminOrderService {
  /**
   * Get all orders with admin filters and pagination
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

    queryParams.append("page", page.toString());
    queryParams.append("pageSize", pageSize.toString());

    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.startDate) queryParams.append("startDate", filters.startDate);
    if (filters?.endDate) queryParams.append("endDate", filters.endDate);
    if (filters?.userId) queryParams.append("userId", filters.userId);

    const response = await httpClient.get<ApiResponse<OrdersResponse>>(
      `/admin/orders?${queryParams.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get order by ID (admin view with all details)
   */
  static async getOrderById(id: string): Promise<Order> {
    const response = await httpClient.get<ApiResponse<Order>>(
      `/admin/orders/${id}`
    );
    return response.data.data;
  }

  /**
   * Update order status (admin only)
   */
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"],
    notes?: string
  ): Promise<Order> {
    const response = await httpClient.put<ApiResponse<Order>>(
      `/admin/orders/${orderId}/status`,
      {
        status,
        notes,
      }
    );
    return response.data.data;
  }

  /**
   * Cancel order (admin only)
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const response = await httpClient.put<ApiResponse<Order>>(
      `/admin/orders/${orderId}/cancel`,
      {
        reason,
      }
    );
    return response.data.data;
  }

  /**
   * Bulk update order statuses (admin only)
   */
  static async bulkUpdateOrderStatus(
    orderIds: string[],
    status: Order["status"],
    notes?: string
  ): Promise<Order[]> {
    const response = await httpClient.put<ApiResponse<Order[]>>(
      "/admin/orders/bulk-status",
      {
        orderIds,
        status,
        notes,
      }
    );
    return response.data.data;
  }

  /**
   * Get order statistics for admin dashboard
   */
  static async getOrderStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalCustomers: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    revenueByPeriod: Array<{ date: string; revenue: number; orders: number }>;
  }> {
    const queryParams = new URLSearchParams();

    if (startDate) {
      queryParams.append("startDate", startDate);
    }
    if (endDate) {
      queryParams.append("endDate", endDate);
    }

    const response = await httpClient.get<ApiResponse<any>>(
      `/admin/orders/statistics?${queryParams.toString()}`
    );
    return response.data.data;
  }

  /**
   * Export orders to CSV/Excel (admin only)
   */
  static async exportOrders(
    format: "csv" | "excel" = "csv",
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append("format", format);

    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.startDate) queryParams.append("startDate", filters.startDate);
    if (filters?.endDate) queryParams.append("endDate", filters.endDate);

    const response = await httpClient.get(
      `/admin/orders/export?${queryParams.toString()}`,
      {
        responseType: "blob",
      }
    );

    return response.data;
  }

  /**
   * Create manual order (admin only)
   */
  static async createManualOrder(orderData: {
    userId?: string;
    customerEmail: string;
    customerName: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    notes?: string;
  }): Promise<Order> {
    const response = await httpClient.post<ApiResponse<Order>>(
      "/admin/orders",
      orderData
    );
    return response.data.data;
  }

  /**
   * Search orders with advanced criteria
   */
  static async searchOrders(
    query: string,
    filters?: {
      orderNumber?: string;
      customerEmail?: string;
      productId?: string;
      dateRange?: [string, string];
      priceRange?: [number, number];
      status?: string[];
    }
  ): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);

    if (filters?.orderNumber)
      queryParams.append("orderNumber", filters.orderNumber);
    if (filters?.customerEmail)
      queryParams.append("customerEmail", filters.customerEmail);
    if (filters?.productId) queryParams.append("productId", filters.productId);

    if (filters?.dateRange) {
      queryParams.append("startDate", filters.dateRange[0]);
      queryParams.append("endDate", filters.dateRange[1]);
    }

    if (filters?.priceRange) {
      queryParams.append("minAmount", filters.priceRange[0].toString());
      queryParams.append("maxAmount", filters.priceRange[1].toString());
    }

    if (filters?.status?.length) {
      filters.status.forEach((status) => queryParams.append("status", status));
    }

    const response = await httpClient.get<ApiResponse<Order[]>>(
      `/admin/orders/search?${queryParams.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get order timeline/history
   */
  static async getOrderHistory(orderId: string): Promise<
    Array<{
      id: string;
      action: string;
      description: string;
      performedBy: string;
      performedAt: string;
      metadata?: any;
    }>
  > {
    const response = await httpClient.get<ApiResponse<any>>(
      `/admin/orders/${orderId}/history`
    );
    return response.data.data;
  }
}
