import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2 } from "lucide-react";
import ProductService from "@/services/productService";
import type {
  Product,
  ProductsResponse,
  Category,
  ProductFilters,
} from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const categoryParam = searchParams.get("categoria") || "todos";
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsResponse, setProductsResponse] =
    useState<ProductsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await ProductService.getCategories();
        setCategories([
          { id: "todos", name: "Todos", productCount: 0 },
          ...categoriesData,
        ]);
      } catch (error) {
        console.error("Failed to load categories:", error);
        // Use fallback categories
        setCategories([
          { id: "todos", name: "Todos", productCount: 0 },
          { id: "canecas", name: "Canecas", productCount: 0 },
          { id: "pratos", name: "Pratos", productCount: 0 },
          { id: "placas", name: "Placas Decorativas", productCount: 0 },
        ]);
      }
    };

    loadCategories();
  }, []);

  // Load products when filters change
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: ProductFilters = {
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      if (selectedCategory && selectedCategory !== "todos") {
        filters.category = selectedCategory;
      }

      const response = await ProductService.getProducts(
        currentPage,
        pageSize,
        filters,
      );

      setProductsResponse(response);
      setProducts(response.value?.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      const errorMessage = parseApiError(error as any).message;
      setError(errorMessage);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, currentPage]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "todos" || product.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8 text-center">
          Nossos Produtos
        </h1>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
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
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>

                {/* Pagination */}
                {productsResponse && productsResponse.totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>

                    {Array.from(
                      { length: Math.min(5, productsResponse.totalPages) },
                      (_, i) => {
                        const pageNum =
                          currentPage <= 3 ? i + 1 : currentPage + i - 2;

                        if (pageNum > productsResponse.totalPages) return null;

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
                      disabled={currentPage === productsResponse.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}

                {/* Results info */}
                {productsResponse && (
                  <div className="text-center mt-6 text-sm text-muted-foreground">
                    Mostrando {products.length} de {productsResponse.totalItems}{" "}
                    produtos
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
