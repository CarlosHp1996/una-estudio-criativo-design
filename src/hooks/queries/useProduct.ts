import { useQuery } from "@tanstack/react-query";
import ProductService from "@/services/productService";
import type { Product } from "@/types/api";
import { queryKeys } from "./queryKeys";

/**
 * Produto unico por id. So dispara quando ha `id` (rota /produto/:id).
 */
export function useProduct(id: string | undefined) {
  return useQuery<Product | null>({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: () => ProductService.getProductById(id as string),
    enabled: !!id,
  });
}

/**
 * Recomendacoes/relacionados de um produto. Depende de `productId`.
 */
export function useRecommendations(
  productId: string | undefined,
  limit: number = 4,
) {
  return useQuery<Product[]>({
    queryKey: queryKeys.products.recommendations(productId ?? "", limit),
    queryFn: () => ProductService.getRecommendations(productId as string, limit),
    enabled: !!productId,
  });
}
