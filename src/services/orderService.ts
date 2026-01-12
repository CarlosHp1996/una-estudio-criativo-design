import { httpClient } from "../lib/httpClient";
import {
  Order,
  CreateOrderRequest,
  OrdersResponse,
  PaginatedResponse,
  ApiResponse,
} from "../types/api";
import { parseApiError } from "../lib/errorHandling";

/**
 * Order Service - Handles all order-related API operations
 * Integrates with backend .NET API for order management
 */
export class OrderService {
  private static readonly BASE_PATH = "/orders";

  /**
   * Create a new order from current cart
   */
  static async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      const response = await httpClient.post<ApiResponse<Order>>(
        this.BASE_PATH,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.createOrder failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get user's order history with pagination
   */
  static async getOrders(
    page: number = 1,
    pageSize: number = 10,
    status?: Order["status"]
  ): Promise<OrdersResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (status) {
        params.append("status", status);
      }

      const response = await httpClient.get<ApiResponse<OrdersResponse>>(
        `${this.BASE_PATH}?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.getOrders failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get specific order by ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await httpClient.get<ApiResponse<Order>>(
        `${this.BASE_PATH}/${orderId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.getOrderById failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get order by order number (public lookup)
   */
  static async getOrderByNumber(orderNumber: string): Promise<Order> {
    try {
      const response = await httpClient.get<ApiResponse<Order>>(
        `${this.BASE_PATH}/number/${orderNumber}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.getOrderByNumber failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await httpClient.delete<ApiResponse<Order>>(
        `${this.BASE_PATH}/${orderId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.cancelOrder failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get order status updates/tracking
   */
  static async getOrderTracking(orderId: string): Promise<any[]> {
    try {
      const response = await httpClient.get<ApiResponse<any[]>>(
        `${this.BASE_PATH}/${orderId}/tracking`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.getOrderTracking failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Update order status (admin only)
   */
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"],
    notes?: string
  ): Promise<Order> {
    try {
      const response = await httpClient.put<ApiResponse<Order>>(
        `${this.BASE_PATH}/${orderId}/status`,
        { status, notes }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.updateOrderStatus failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get order statistics for dashboard
   */
  static async getOrderStatistics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<any>>(
        `${this.BASE_PATH}/statistics`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("OrderService.getOrderStatistics failed:", error);
      throw parseApiError(error);
    }
  }
}
