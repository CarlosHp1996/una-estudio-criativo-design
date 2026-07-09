import { useQuery, keepPreviousData } from "@tanstack/react-query";
import ProductService from "@/services/productService";
import type { ProductFilters, ProductsResponse } from "@/types/api";
import { queryKeys } from "./queryKeys";

/**
 * Lista paginada de produtos com filtros.
 *
 * O queryKey inclui page/pageSize/filters, entao cada combinacao vira uma
 * entrada de cache independente. `keepPreviousData` mantem a pagina anterior
 * visivel enquanto a proxima carrega (paginacao sem "flash" de skeleton).
 */
export function useProducts(
  page: number,
  pageSize: number,
  filters?: ProductFilters,
) {
  return useQuery<ProductsResponse>({
    queryKey: queryKeys.products.list(page, pageSize, filters),
    queryFn: () => ProductService.getProducts(page, pageSize, filters),
    placeholderData: keepPreviousData,
  });
}
