// API Types - Based on backend documentation
export interface User {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  userName: string;
  cpf: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: User;
}

export interface SocialUser {
  provider: "google" | "facebook";
  providerId: string;
  email: string;
  name: string;
  profilePicture?: string;
  accessToken: string;
}

export interface SocialAuthRequest {
  socialUser: SocialUser;
}

export interface SocialAuthResponse {
  jwtToken: string;
  expiration: string;
  isNewUser: boolean;
  message: string;
  user: User;
}

// Simplified Google login request (just access token)
export interface GoogleLoginRequest {
  accessToken: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  images: string[];
  averageRating: number;
  totalReviews: number;
  inventory: {
    quantity: number;
    minStock: number;
    isInStock: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  items: Product[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: "name" | "price" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  images: string[];
  inventory: {
    quantity: number;
    minStock: number;
  };
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}

// Order types
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentStatus: "pending" | "approved" | "failed";
  trackingCode?: string; // Optional tracking code when order is shipped
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  notes?: string;
}

export interface OrdersResponse {
  items: Order[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

// Payment types
export interface CardDetails {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  holderName: string;
}

export interface PaymentRequest {
  orderId: string;
  paymentMethod: string;
  amount: number;
  cardDetails?: CardDetails; // Optional for PIX/Boleto
  returnUrl?: string; // For AbacatePay redirect flow
  completionUrl?: string; // For AbacatePay redirect flow
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: "pending" | "approved" | "failed";
  method: string;
  transactionId: string;
  processedAt: string;
  expiresAt: string;
  // AbacatePay specific fields
  billingId?: string;
  paymentUrl?: string;
  pixCode?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: "pending" | "approved" | "failed";
  transactionId: string;
  message: string;
  approvedAt?: string;
  errorCode?: string;
  // AbacatePay specific fields
  billingId?: string; // AbacatePay billing ID
  paymentUrl?: string; // URL for PIX/Boleto payment
  pixCode?: string; // PIX code for copying
  pixQrCode?: string; // PIX QR Code image
  boletoUrl?: string; // Boleto PDF URL
  expiresAt?: string; // Payment expiration
}

export interface PaymentsResponse {
  items: Payment[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

// Tracking types
export interface TrackingHistory {
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

export interface Tracking {
  id: string;
  trackingCode: string;
  orderId: string;
  status: string;
  shippingCompany: string;
  estimatedDelivery: string;
  history: TrackingHistory[];
}

// Profile management types
export interface UpdateProfileRequest {
  email?: string;
  userName?: string;
  cpf?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Common API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Search and filter parameters
export interface ProductFilters extends PaginationParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Error response type
export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
