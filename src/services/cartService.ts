// Cart Service - API Integration
import { httpClient, apiUtils } from "@/lib/httpClient";
import type {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartRequest,
} from "@/types/api";

export class CartService {
  // Get current user's cart
  static async getCart(): Promise<Cart> {
    try {
      const response = await apiUtils.get<{ value: Cart }>("/cart");
      return response.value;
    } catch (error: any) {
      // If cart doesn't exist, return empty cart structure
      if (error.response?.status === 404) {
        return {
          id: "",
          userId: "",
          items: [],
          totalItems: 0,
          totalAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  }

  // Add item to cart
  static async addToCart(data: AddToCartRequest): Promise<Cart> {
    const response = await apiUtils.post<{ value: Cart }>("/cart/add", data);
    return response.value;
  }

  // Update item quantity in cart
  static async updateCartItem(
    itemId: string,
    data: UpdateCartRequest,
  ): Promise<Cart> {
    const response = await apiUtils.put<{ value: Cart }>(
      `/cart/update/${itemId}`,
      data,
    );
    return response.value;
  }

  // Remove item from cart
  static async removeFromCart(itemId: string): Promise<Cart> {
    const response = await apiUtils.delete<{ value: Cart }>(
      `/cart/remove/${itemId}`,
    );
    return response.value;
  }

  // Clear entire cart
  static async clearCart(): Promise<void> {
    await apiUtils.delete<void>("/cart/clear");
  }

  // Apply coupon/discount code
  static async applyCoupon(couponCode: string): Promise<Cart> {
    return await apiUtils.post<Cart>("/cart/coupon", { couponCode });
  }

  // Remove coupon
  static async removeCoupon(): Promise<Cart> {
    return await apiUtils.delete<Cart>("/cart/coupon");
  }

  // Get cart summary for checkout
  static async getCartSummary(): Promise<{
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  }> {
    return await apiUtils.get("/cart/summary");
  }

  // Sync local cart with server (for migration)
  static async syncLocalCart(
    localItems: Array<{
      productId: string;
      quantity: number;
    }>,
  ): Promise<Cart> {
    return await apiUtils.post<Cart>("/cart/sync", { items: localItems });
  }

  // Validate cart items (check availability, prices)
  static async validateCart(): Promise<{
    valid: boolean;
    issues?: Array<{
      itemId: string;
      productId: string;
      issue: "out_of_stock" | "price_changed" | "product_not_found";
      message: string;
    }>;
  }> {
    return await apiUtils.post("/cart/validate");
  }
}

export default CartService;
