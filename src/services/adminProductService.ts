import { httpClient } from "../lib/httpClient";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductsResponse,
  ApiResponse,
  Category,
} from "../types/api";

export class AdminProductService {
  /**
   * Get all products with admin pagination and filters
   */
  static async getAllProducts(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      search?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      stockQuantity?: number;
    },
  ): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("Page", page.toString());
    queryParams.append("PageSize", pageSize.toString());

    // Adicionar filtros conforme backend
    if (filters?.stockQuantity !== undefined) {
      queryParams.append("StockQuantity", filters.stockQuantity.toString());
    }
    if (filters?.search) {
      queryParams.append("Search", filters.search);
    }
    if (filters?.category) {
      queryParams.append("Category", filters.category);
    }

    const response = await httpClient.get<ProductsResponse>(
      `/Product/get?${queryParams.toString()}`,
    );
    return response.data;
  }

  /**
   * Create a new product (admin only)
   */
  static async createProduct(
    formData: FormData,
    isFormData: boolean = false,
  ): Promise<any> {
    // Buscar token do localStorage (ajuste conforme seu fluxo de auth)
    const token = localStorage.getItem("una_token");
    const response = await fetch("https://localhost:4242/api/Product/create", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erro ao criar produto");
    }
    return response.json();
  }

  /**
   * Update an existing product (admin only)
   */
  static async updateProduct(
    id: string,
    productData: Partial<CreateProductRequest>,
  ): Promise<Product> {
    const response = await httpClient.put<ApiResponse<Product>>(
      `/products/${id}`,
      productData,
    );
    return response.data.data;
  }

  /**
   * Delete a product (admin only)
   */
  static async deleteProduct(id: string): Promise<void> {
    await httpClient.delete(`/products/${id}`);
  }

  /**
   * Get product by ID (admin view with full details)
   */
  static async getProductById(id: string): Promise<Product> {
    const response = await httpClient.get<ApiResponse<Product>>(
      `/products/${id}`,
    );
    return response.data.data;
  }

  /**
   * Get available categories
   */

  /**
   * Bulk update products (admin only)
   */
  static async bulkUpdateProducts(
    updates: { id: string; data: Partial<CreateProductRequest> }[],
  ): Promise<Product[]> {
    const response = await httpClient.put<ApiResponse<Product[]>>(
      "/products/bulk",
      { updates },
    );
    return response.data.data;
  }

  /**
   * Bulk delete products (admin only)
   */
  static async bulkDeleteProducts(productIds: string[]): Promise<void> {
    await httpClient.delete("/products/bulk", { data: { ids: productIds } });
  }

  /**
   * Upload product images
   */
  static async uploadImages(files: FileList | File[]): Promise<string[]> {
    const formData = new FormData();

    Array.from(files).forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await httpClient.post<ApiResponse<{ urls: string[] }>>(
      "/products/upload-images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data.urls;
  }

  /**
   * Search products with advanced filters
   */
  static async searchProducts(
    query: string,
    filters?: {
      categories?: string[];
      priceRange?: [number, number];
      stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
      dateRange?: [string, string];
    },
  ): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);

    if (filters?.categories?.length) {
      filters.categories.forEach((cat) =>
        queryParams.append("categories", cat),
      );
    }

    if (filters?.priceRange) {
      queryParams.append("minPrice", filters.priceRange[0].toString());
      queryParams.append("maxPrice", filters.priceRange[1].toString());
    }

    if (filters?.stockStatus) {
      queryParams.append("stockStatus", filters.stockStatus);
    }

    if (filters?.dateRange) {
      queryParams.append("startDate", filters.dateRange[0]);
      queryParams.append("endDate", filters.dateRange[1]);
    }

    const response = await httpClient.get<ApiResponse<Product[]>>(
      `/products/search?${queryParams.toString()}`,
    );
    return response.data.data;
  }
}
