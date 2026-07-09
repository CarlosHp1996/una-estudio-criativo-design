import { useQuery } from "@tanstack/react-query";
import ProductService from "@/services/productService";
import type { Category } from "@/types/api";
import { queryKeys } from "./queryKeys";

/**
 * Categorias (derivadas do enum fixo do backend). Sao estaticas, entao usam
 * staleTime alto — praticamente nunca precisam refetch dentro da sessao.
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
    queryFn: () => ProductService.getCategories(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
