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
  // Mapeia produtos do backend para o formato esperado pelo frontend
  private static mapProduct(product: any): Product {
    const mapped = {
      ...product,
      // Garantir compatibilidade de campos
      image: product.imageUrl || product.image,
      imageUrl: product.imageUrl || product.image,
      stock: product.stockQuantity ?? product.stock,
      stockQuantity: product.stockQuantity ?? product.stock ?? 0,
      // Extrair categoria dos attributes se disponível
      category: product.attributes?.[0]?.category ?? product.category,
      // Garantir que images seja um array
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      // Criar objeto inventory para compatibilidade
      inventory: {
        quantity: product.stockQuantity ?? product.stock ?? 0,
        minStock: 5,
        isInStock: (product.stockQuantity ?? product.stock ?? 0) > 0,
      },
    };

    // Debug log
    if (!mapped.imageUrl && !mapped.image) {
      console.warn("Product mapped without image:", {
        original: product,
        mapped,
      });
    }

    return mapped;
  }

  // Get all products with pagination and filters
  static async getProducts(
    page: number = 1,
    pageSize: number = 12,
    filters?: ProductFilters,
    useCache: boolean = true,
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      Page: page.toString(),
      PageSize: pageSize.toString(),
    });

    // Add filters if provided
    if (filters) {
      if (filters.search) {
        params.append("Search", filters.search);
      }
      if (filters.category) {
        params.append("Category", filters.category);
      }
      if (filters.minPrice) {
        params.append("MinPrice", filters.minPrice.toString());
      }
      if (filters.maxPrice) {
        params.append("MaxPrice", filters.maxPrice.toString());
      }
      if (filters.sortBy) {
        params.append("SortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("SortOrder", filters.sortOrder);
      }
    }

    const url = `/Product/get?${params.toString()}`;

    let response: ProductsResponse;
    if (!useCache) {
      response = await apiUtils.get<ProductsResponse>(url);
    } else {
      // Generate cache key based on parameters
      const cacheKey = generateCacheKey("products", {
        page,
        pageSize,
        ...filters,
      });

      response = await cachedRequest(
        cacheKey,
        () => apiUtils.get<ProductsResponse>(url),
        CacheConfig.DYNAMIC,
      );
    }

    // Mapear produtos para garantir compatibilidade
    if (response.value?.products) {
      response.value.products = response.value.products.map(this.mapProduct);
    }

    return response;
  }

  // Get product by ID - using the same endpoint with filters
  static async getProductById(
    productId: string,
    useCache: boolean = true,
  ): Promise<Product | null> {
    try {
      const response = await this.getProducts(1, 100, {}, useCache);
      const product = response.value?.products.find((p) => p.id === productId);
      return product || null;
    } catch (error) {
      console.error("Failed to get product by ID:", error);
      return null;
    }
  }

  // Search products - uses the same getProducts endpoint with search filter
  static async searchProducts(
    query: string,
    page: number = 1,
    pageSize: number = 12,
  ): Promise<ProductsResponse> {
    return await this.getProducts(page, pageSize, { search: query });
  }

  // Get products by category - uses the same getProducts endpoint with category filter
  static async getProductsByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 12,
  ): Promise<ProductsResponse> {
    return await this.getProducts(page, pageSize, { category });
  }

  // Get categories - placeholder (backend doesn't have this endpoint yet)
  static async getCategories(): Promise<Category[]> {
    // TODO: Implement backend endpoint /Product/categories
    // For now, return empty array - categories will be extracted from products
    return [];
  }
}

export default ProductService;
