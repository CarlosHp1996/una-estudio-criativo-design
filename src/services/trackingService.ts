import { httpClient } from "../lib/httpClient";
import { Tracking, ApiResponse, PaginationParams } from "../types/api";

export class TrackingService {
  /**
   * Get tracking information by code (public endpoint)
   */
  static async getTrackingByCode(trackingCode: string): Promise<Tracking> {
    const response = await httpClient.get<ApiResponse<Tracking>>(
      `/tracking/${trackingCode}`
    );
    return response.data.data;
  }

  /**
   * Get user's tracking list (authenticated)
   */
  static async getMyTrackings(params: PaginationParams = {}): Promise<{
    items: Tracking[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const response = await httpClient.get<ApiResponse<any>>(
      `/tracking?${queryParams.toString()}`
    );
    return response.data.data;
  }

  /**
   * Create new tracking (admin only)
   */
  static async createTracking(data: {
    orderId: string;
    shippingCompany: string;
    estimatedDelivery: string;
  }): Promise<Tracking> {
    const response = await httpClient.post<ApiResponse<Tracking>>(
      "/tracking",
      data
    );
    return response.data.data;
  }

  /**
   * Update tracking status (admin only)
   */
  static async updateTrackingStatus(
    trackingCode: string,
    data: {
      status: string;
      description: string;
      location: string;
    }
  ): Promise<Tracking> {
    const response = await httpClient.put<ApiResponse<Tracking>>(
      `/tracking/${trackingCode}/status`,
      data
    );
    return response.data.data;
  }

  /**
   * Get tracking status labels for UI
   */
  static getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      shipped: "Enviado",
      in_transit: "Em Trânsito",
      out_for_delivery: "Saiu para Entrega",
      delivered: "Entregue",
      delivery_failed: "Falha na Entrega",
      returned: "Retornado",
      cancelled: "Cancelado",
    };

    return statusLabels[status] || status;
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      shipped: "text-blue-600",
      in_transit: "text-yellow-600",
      out_for_delivery: "text-orange-600",
      delivered: "text-green-600",
      delivery_failed: "text-red-600",
      returned: "text-gray-600",
      cancelled: "text-red-600",
    };

    return statusColors[status] || "text-gray-600";
  }

  /**
   * Get status icon for UI
   */
  static getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      shipped: "📦",
      in_transit: "🚚",
      out_for_delivery: "🚛",
      delivered: "✅",
      delivery_failed: "❌",
      returned: "🔄",
      cancelled: "🚫",
    };

    return statusIcons[status] || "📍";
  }
}
