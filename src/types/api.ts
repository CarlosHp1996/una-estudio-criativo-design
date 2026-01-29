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
  user: User;
  success: boolean;
}

export interface SocialUser {
  providerId: string;
  provider: string; // "google" or "facebook"
  email: string;
  name: string;
  picture?: string;
}

export interface SocialAuthRequest {
  socialUser: SocialUser;
  returnUrl?: string;
}

export interface SocialAuthResponse {
  jwtToken: string;
  user: User;
  success: boolean;
}

// Simplified Google login request (just access token)
export interface GoogleLoginRequest {
  accessToken: string;
}

// ✅ CORREÇÃO: Tipo Product atualizado para corresponder ao backend real
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number; // ✅ Backend retorna stockQuantity, não inventory.quantity
  imageUrl: string; // ✅ Backend retorna imageUrl (string), não images (array)
  isActive: boolean;
  attributes: ProductAttributeDto[]; // ✅ Backend retorna attributes com category
  createdAt?: string;
  updatedAt?: string;
  // ⚠️ Campos adicionais para compatibilidade com o frontend (calculados)
  category?: EnumCategory | string; // Extraído de attributes[0].category
  tags?: string[];
  averageRating?: number;
  totalReviews?: number;
  inventory?: {
    // Para compatibilidade com código existente
    quantity: number; // Mapeado de stockQuantity
    minStock: number;
    isInStock: boolean; // Calculado de stockQuantity > 0
  };
  images?: string[]; // Para compatibilidade (array com imageUrl)
}

// EnumCategory igual backend
export enum EnumCategory {
  Teste1 = 0,
  Teste2 = 1,
  Teste3 = 2,
}

// ✅ CORREÇÃO: Estrutura correta da resposta do backend
export interface ProductsValue {
  products: Product[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    quantityRanges: {
      minQuantity: number;
      maxQuantity: number;
      productCount: number;
    }[];
    minPrice: number;
    maxPrice: number;
  };
}

export interface ProductsResponse {
  value: ProductsValue;
  count: number;
  hasSuccess: boolean;
  hasError: boolean;
  message: string | null;
  errors: any[];
  httpStatusCode: string;
  dataRequisicao: string;
  errorMessage: string | null;
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

// Para request de criação, refletindo backend
export interface ProductAttributeRequest {
  category?: EnumCategory | string | number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: File | null;
  isActive: boolean;
  attributes?: ProductAttributeRequest[];
  // Campos extras para o formulário
  category?: string;
  tags?: string[];
  inventory?: { quantity: number; minStock: number };
}

// Para response
export interface ProductAttributeDto {
  id?: string | null;
  category: string; // Backend retorna como string (ex: "Teste1")
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attributes: ProductAttributeDto[];
  message?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id?: string;
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
