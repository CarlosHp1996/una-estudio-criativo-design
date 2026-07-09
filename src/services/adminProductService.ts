import { httpClient, API_BASE_URL } from "../lib/httpClient";
import { Product, ProductsResponse, ApiResponse } from "../types/api";

/**
 * AdminProductService
 *
 * Rotas REAIS do backend (ProductController — prefixos "api/Product" e "api/products"):
 *   GET    /Product/get          -> lista paginada (GetProductsRequestFilter)
 *   GET    /Product/get/{id}     -> produto por id (tambem aceita /products/{id})
 *   POST   /Product/create       -> cria produto ([FromForm], multipart)
 *   PUT    /Product/update/{id}  -> atualiza produto ([FromForm], multipart)
 *   DELETE /Product/delete       -> remove um ou mais produtos ([FromBody] List<Guid>)
 *
 * NAO existem no backend: bulk update, upload de imagens isolado e busca
 * avancada. Essas operacoes foram removidas deste service (nao havia consumidor).
 * Criacao/atualizacao usam `fetch` porque enviam FormData multipart, mas sempre
 * apontando para a rota real via API_BASE_URL.
 */
export class AdminProductService {
  /**
   * Lista produtos com paginacao/filtros.
   * Rota real: GET /Product/get. Retorna o envelope completo — as paginas admin
   * consomem `response.value.products` e `response.value.pagination`.
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
    }
  ): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("Page", page.toString());
    queryParams.append("PageSize", pageSize.toString());

    if (filters?.inStock === true) {
      queryParams.append("StockQuantity", "1");
    } else if (filters?.stockQuantity !== undefined) {
      queryParams.append("StockQuantity", filters.stockQuantity.toString());
    }
    if (filters?.search) {
      queryParams.append("Search", filters.search);
    }
    if (filters?.category) {
      queryParams.append("Category", filters.category);
    }
    if (filters?.minPrice !== undefined) {
      queryParams.append("MinPrice", filters.minPrice.toString());
    }
    if (filters?.maxPrice !== undefined) {
      queryParams.append("MaxPrice", filters.maxPrice.toString());
    }

    const response = await httpClient.get<ProductsResponse>(
      `/Product/get?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Cria um produto (admin).
   * Rota real: POST /Product/create ([FromForm] — precisa de multipart/FormData,
   * por isso usamos `fetch` em vez do httpClient).
   */
  static async createProduct(formData: FormData): Promise<unknown> {
    const token = localStorage.getItem("una_token");
    const response = await fetch(`${API_BASE_URL}/Product/create`, {
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
   * Atualiza um produto (admin).
   * Rota real: PUT /Product/update/{id} ([FromForm] — multipart/FormData).
   */
  static async updateProduct(
    id: string,
    formData: FormData
  ): Promise<unknown> {
    const token = localStorage.getItem("una_token");
    const response = await fetch(`${API_BASE_URL}/Product/update/${id}`, {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erro ao atualizar produto");
    }
    return response.json();
  }

  /**
   * Ativa/desativa um produto.
   * Rota real: PUT /Product/update/{id} enviando apenas IsActive via FormData.
   */
  static async updateProductStatus(
    id: string,
    isActive: boolean
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append("IsActive", isActive.toString());

    const response = await httpClient.put(`/Product/update/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Remove um produto (admin).
   * Rota real: DELETE /Product/delete ([FromBody] List<Guid>).
   */
  static async deleteProduct(id: string): Promise<unknown> {
    const token = localStorage.getItem("una_token");
    const response = await fetch(`${API_BASE_URL}/Product/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        accept: "text/plain",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify([id]),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erro ao deletar produto");
    }
    return response.json();
  }

  /**
   * Remove varios produtos de uma vez.
   * Rota real: DELETE /Product/delete ([FromBody] List<Guid>) — o proprio
   * endpoint ja aceita uma lista de ids, entao nao ha rota "bulk" separada.
   */
  static async bulkDeleteProducts(productIds: string[]): Promise<void> {
    const token = localStorage.getItem("una_token");
    const response = await fetch(`${API_BASE_URL}/Product/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        accept: "text/plain",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(productIds),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erro ao deletar produtos");
    }
  }

  /**
   * Busca um produto pelo id (visao admin).
   * Rota real: GET /products/{id} (envelope .value = produto).
   */
  static async getProductById(id: string): Promise<Product> {
    const response = await httpClient.get<ApiResponse<Product>>(
      `/products/${id}`
    );
    return response.data.value;
  }
}
