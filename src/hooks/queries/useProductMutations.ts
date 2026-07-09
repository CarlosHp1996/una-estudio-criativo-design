import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminProductService } from "@/services/adminProductService";
import { queryKeys } from "./queryKeys";

/**
 * Mutations de produto (admin) via React Query.
 *
 * Cada hook envolve o metodo de ESCRITA correspondente do AdminProductService e,
 * no onSuccess, invalida as chaves de produto (`queryKeys.products`). Assim,
 * qualquer consumidor de leitura via React Query (ex.: storefront `useProducts`,
 * `useProduct`) refaz o fetch sozinho apos a escrita — sem refetch manual.
 *
 * As paginas continuam responsaveis por toasts e por acoes locais no onSuccess/
 * onError do `mutate` (ex.: fechar modal, atualizar estado local). Use `isPending`
 * para o loading dos botoes.
 */

/** Cria um produto (FormData multipart). Rota real: POST /Product/create. */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      AdminProductService.createProduct(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

/** Atualiza um produto (FormData multipart). Rota real: PUT /Product/update/{id}. */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      AdminProductService.updateProduct(id, formData),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

/** Ativa/desativa um produto. Rota real: PUT /Product/update/{id} (IsActive). */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      AdminProductService.updateProductStatus(id, isActive),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

/** Remove um produto. Rota real: DELETE /Product/delete ([id]). */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

/** Remove varios produtos. Rota real: DELETE /Product/delete ([ids]). */
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      AdminProductService.bulkDeleteProducts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
