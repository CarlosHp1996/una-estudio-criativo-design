// Product Service - API Integration with Caching
import { httpClient, apiUtils } from "@/lib/httpClient";
import {
  cachedRequest,
  generateCacheKey,
  CacheConfig,
} from "@/lib/requestCache";
import type {
  Product,
  ProductsResponse,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
} from "@/types/api";

export class ProductService {
  // Get all products with pagination and filters
  static async getProducts(
    page: number = 1,
    pageSize: number = 12,
    filters?: ProductFilters,
    useCache: boolean = true,
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    // Add filters if provided
    if (filters) {
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.category) {
        params.append("category", filters.category);
      }
      if (filters.minPrice) {
        params.append("minPrice", filters.minPrice.toString());
      }
      if (filters.maxPrice) {
        params.append("maxPrice", filters.maxPrice.toString());
      }
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach((tag) => params.append("tags", tag));
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }
    }

    const url = `/products?${params.toString()}`;

    if (!useCache) {
      return await apiUtils.get<ProductsResponse>(url);
    }

    // Generate cache key based on parameters
    const cacheKey = generateCacheKey("products", {
      page,
      pageSize,
      ...filters,
    });

    return await cachedRequest(
      cacheKey,
      () => apiUtils.get<ProductsResponse>(url),
      CacheConfig.DYNAMIC,
    );
  }

  // Get product by ID with caching
  static async getProductById(
    productId: string,
    useCache: boolean = true,
  ): Promise<Product> {
    if (!useCache) {
      return await apiUtils.get<Product>(`/products/${productId}`);
    }

    const cacheKey = generateCacheKey("product-detail", { productId });

    return await cachedRequest(
      cacheKey,
      () => apiUtils.get<Product>(`/products/${productId}`),
      CacheConfig.STATIC,
    );
  }

  // Search products
  static async searchProducts(
    query: string,
    page: number = 1,
    pageSize: number = 12,
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      search: query,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return await apiUtils.get<ProductsResponse>(
      `/products/search?${params.toString()}`,
    );
  }

  // Get products by category
  static async getProductsByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 12,
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      category,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return await apiUtils.get<ProductsResponse>(
      `/products?${params.toString()}`,
    );
  }

  // Get featured products (home page)
  static async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    const params = new URLSearchParams({
      featured: "true",
      pageSize: limit.toString(),
    });

    const response = await apiUtils.get<ProductsResponse>(
      `/products?${params.toString()}`,
    );

    return response.items;
  }

  // Get popular tags
  static async getPopularTags(limit: number = 20): Promise<string[]> {
    return await apiUtils.get<string[]>(`/products/tags?limit=${limit}`);
  }

  // Get product recommendations (based on user history or similar products)
  static async getRecommendations(
    productId?: string,
    limit: number = 4,
  ): Promise<Product[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (productId) {
      params.append("basedOn", productId);
    }

    return await apiUtils.get<Product[]>(
      `/products/recommendations?${params.toString()}`,
    );
  }

  // Admin methods (if user has admin role)
  static async createProduct(data: CreateProductRequest): Promise<Product> {
    return await apiUtils.post<Product>("/admin/products", data);
  }

  static async updateProduct(
    productId: string,
    data: UpdateProductRequest,
  ): Promise<Product> {
    return await apiUtils.put<Product>(`/admin/products/${productId}`, data);
  }

  static async deleteProduct(productId: string): Promise<void> {
    return await apiUtils.delete<void>(`/admin/products/${productId}`);
  }

  // Product reviews (if available)
  static async getProductReviews(
    productId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return await apiUtils.get<any>(
      `/products/${productId}/reviews?${params.toString()}`,
    );
  }

  static async addProductReview(productId: string, review: any): Promise<any> {
    return await apiUtils.post<any>(`/products/${productId}/reviews`, review);
  }
}

export default ProductService;
