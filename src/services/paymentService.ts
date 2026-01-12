import { httpClient } from "../lib/httpClient";
import {
  Payment,
  PaymentRequest,
  PaymentResponse,
  PaymentsResponse,
  ApiResponse,
} from "../types/api";
import { parseApiError } from "../lib/errorHandling";

/**
 * Payment Service - Handles all payment-related API operations
 * Integrates with backend .NET API for payment processing
 */
export class PaymentService {
  private static readonly BASE_PATH = "/payments";

  /**
   * Process a payment for an order
   */
  static async processPayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const response = await httpClient.post<ApiResponse<PaymentResponse>>(
        `${this.BASE_PATH}/process`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.processPayment failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Create AbacatePay billing for PIX/Boleto payments
   * Returns URL for redirect or payment details
   */
  static async createBilling(request: {
    orderId: string;
    amount: number;
    paymentMethod: "pix" | "boleto";
    returnUrl: string;
    completionUrl: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await httpClient.post<ApiResponse<PaymentResponse>>(
        `${this.BASE_PATH}/billing/create`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.createBilling failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get billing status from AbacatePay
   */
  static async getBillingStatus(billingId: string): Promise<{
    status: "pending" | "approved" | "failed";
    paidAt?: string;
    amount: number;
    paymentMethod: string;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<any>>(
        `${this.BASE_PATH}/billing/${billingId}/status`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.getBillingStatus failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Check if payment method supports redirect flow (PIX, Boleto)
   */
  static isRedirectPayment(paymentMethod: string): boolean {
    return ["pix", "boleto"].includes(paymentMethod.toLowerCase());
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const response = await httpClient.get<ApiResponse<Payment>>(
        `${this.BASE_PATH}/${paymentId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.getPaymentById failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get user's payment history with pagination
   */
  static async getPaymentHistory(
    page: number = 1,
    pageSize: number = 10,
    status?: Payment["status"]
  ): Promise<PaymentsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (status) {
        params.append("status", status);
      }

      const response = await httpClient.get<ApiResponse<PaymentsResponse>>(
        `${this.BASE_PATH}?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.getPaymentHistory failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get payments for a specific order
   */
  static async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    try {
      const response = await httpClient.get<ApiResponse<Payment[]>>(
        `${this.BASE_PATH}/order/${orderId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.getPaymentsByOrder failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Retry a failed payment
   */
  static async retryPayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const response = await httpClient.post<ApiResponse<PaymentResponse>>(
        `${this.BASE_PATH}/${paymentId}/retry`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.retryPayment failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Cancel a pending payment
   */
  static async cancelPayment(paymentId: string): Promise<Payment> {
    try {
      const response = await httpClient.delete<ApiResponse<Payment>>(
        `${this.BASE_PATH}/${paymentId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.cancelPayment failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Get payment statistics for dashboard
   */
  static async getPaymentStatistics(): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalAmount: number;
    averagePayment: number;
  }> {
    try {
      const response = await httpClient.get<ApiResponse<any>>(
        `${this.BASE_PATH}/statistics`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("PaymentService.getPaymentStatistics failed:", error);
      throw parseApiError(error);
    }
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  static validateCardNumber(cardNumber: string): boolean {
    // Remove non-numeric characters
    const cleanNumber = cardNumber.replace(/\D/g, "");

    // Check if empty or too short
    if (cleanNumber.length < 13) return false;

    let sum = 0;
    let isEven = false;

    // Process digits from right to left
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Get card type from card number
   */
  static getCardType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, "");

    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(?:011|5)/.test(cleanNumber)) return "discover";
    if (/^35(?:2[89]|[3-8])/.test(cleanNumber)) return "jcb";

    return "unknown";
  }

  /**
   * Validate CVV based on card type
   */
  static validateCVV(cvv: string, cardType?: string): boolean {
    const cleanCVV = cvv.replace(/\D/g, "");

    if (cardType === "amex") {
      return cleanCVV.length === 4;
    }

    return cleanCVV.length === 3;
  }

  /**
   * Validate expiry date (MM/YY format)
   */
  static validateExpiryDate(month: string, year: string): boolean {
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  }
}
