import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2 } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, ProductFilters } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";

const PAGE_SIZE = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const categoryParam = searchParams.get("categoria") || "todos";
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const pageSize = PAGE_SIZE;

  // Categorias (React Query; getCategories deriva do enum, praticamente estatico)
  const { data: categoriesData } = useCategories();
  const categories: Category[] = [
    { id: "todos", name: "Todos", productCount: 0 },
    ...(categoriesData ?? []),
  ];

  // Filtros -> entram no queryKey de useProducts (cache por combinacao)
  const filters = useMemo<ProductFilters>(() => {
    const f: ProductFilters = {
      sortBy: sortBy as ProductFilters["sortBy"],
      sortOrder,
      isActive: true, // Apenas ativos
      inStock: true, // Apenas em estoque
    };
    if (searchTerm.trim()) {
      f.search = searchTerm.trim();
    }
    if (selectedCategory && selectedCategory !== "todos") {
      f.category = selectedCategory;
    }
    return f;
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  const {
    data: productsResponse,
    isLoading,
    isError,
    error: queryError,
  } = useProducts(currentPage, pageSize, filters);

  const products = productsResponse?.value?.products ?? [];
  const error = isError ? parseApiError(queryError as any).message : null;

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      setCurrentPage(1); // Reset to first page
      if (categoryId === "todos") {
        setSearchParams({});
      } else {
        setSearchParams({ categoria: categoryId });
      }
    },
    [setSearchParams],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-");
    setSortBy(field);
    setSortOrder(order as "asc" | "desc");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8 text-center">
          Nossos Produtos
        </h1>

        {/* Search & Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="w-full md:w-56">
            <Select 
              value={`${sortBy}-${sortOrder}`} 
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <SelectValue placeholder="Ordenar por" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor Preço</SelectItem>
                <SelectItem value="price-desc">Maior Preço</SelectItem>
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
              {category.productCount > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  ({category.productCount})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      category={String(product.category || "")}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {productsResponse &&
                  productsResponse.value &&
                  productsResponse.value.pagination &&
                  productsResponse.value.pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-12 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>

                      {Array.from(
                        {
                          length: Math.min(
                            5,
                            productsResponse.value.pagination.totalPages,
                          ),
                        },
                        (_, i) => {
                          const pageNum =
                            currentPage <= 3 ? i + 1 : currentPage + i - 2;

                          if (
                            pageNum >
                            productsResponse.value!.pagination.totalPages
                          )
                            return null;

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === currentPage ? "default" : "outline"
                              }
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}

                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={
                          currentPage ===
                          productsResponse.value!.pagination.totalPages
                        }
                      >
                        Próxima
                      </Button>
                    </div>
                  )}

                {/* Results info */}
                {productsResponse &&
                  productsResponse.value &&
                  productsResponse.value.pagination && (
                    <div className="text-center mt-6 text-sm text-muted-foreground">
                      Mostrando {products.length} de{" "}
                      {productsResponse.value.pagination.totalItems} produtos
                    </div>
                  )}
              </>
            ) : (
              <div className="text-center py-20">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span className="text-muted-foreground">
                      Carregando produtos...
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-lg">
                    Nenhum produto encontrado com os filtros selecionados.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
