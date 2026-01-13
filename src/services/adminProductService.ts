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
    }
  ): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();

    queryParams.append("page", page.toString());
    queryParams.append("pageSize", pageSize.toString());

    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.category) queryParams.append("category", filters.category);
    if (filters?.minPrice !== undefined)
      queryParams.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice !== undefined)
      queryParams.append("maxPrice", filters.maxPrice.toString());
    if (filters?.inStock !== undefined)
      queryParams.append("inStock", filters.inStock.toString());

    const response = await httpClient.get<ApiResponse<ProductsResponse>>(
      `/products?${queryParams.toString()}`
    );
    return response.data.data;
  }

  /**
   * Create a new product (admin only)
   */
  static async createProduct(
    productData: CreateProductRequest
  ): Promise<Product> {
    const response = await httpClient.post<ApiResponse<Product>>(
      "/products",
      productData
    );
    return response.data.data;
  }

  /**
   * Update an existing product (admin only)
   */
  static async updateProduct(
    id: string,
    productData: Partial<CreateProductRequest>
  ): Promise<Product> {
    const response = await httpClient.put<ApiResponse<Product>>(
      `/products/${id}`,
      productData
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
      `/products/${id}`
    );
    return response.data.data;
  }

  /**
   * Get available categories
   */
  static async getCategories(): Promise<Category[]> {
    const response = await httpClient.get<ApiResponse<Category[]>>(
      "/products/categories"
    );
    return response.data.data;
  }

  /**
   * Bulk update products (admin only)
   */
  static async bulkUpdateProducts(
    updates: { id: string; data: Partial<CreateProductRequest> }[]
  ): Promise<Product[]> {
    const response = await httpClient.put<ApiResponse<Product[]>>(
      "/products/bulk",
      { updates }
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
      }
    );

    return response.data.data.urls;
  }

  /**
   * Get product statistics
   */
  static async getProductStatistics(): Promise<{
    totalProducts: number;
    totalCategories: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averagePrice: number;
    mostPopularCategory: string;
  }> {
    const response = await httpClient.get<ApiResponse<any>>(
      "/products/statistics"
    );
    return response.data.data;
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
    }
  ): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);

    if (filters?.categories?.length) {
      filters.categories.forEach((cat) =>
        queryParams.append("categories", cat)
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
      `/products/search?${queryParams.toString()}`
    );
    return response.data.data;
  }
}
