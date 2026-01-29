import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { AdminProductService } from "@/services/adminProductService";
import { Product, EnumCategory } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/ProductForm";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const pageSize = 10;

  useEffect(() => {
    loadProducts();
  }, [currentPage, categoryFilter, stockFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter !== "all") filters.category = categoryFilter;
      if (stockFilter === "in_stock") filters.inStock = true;
      if (stockFilter === "out_of_stock") filters.inStock = false;

      const response = await AdminProductService.getAllProducts(
        currentPage,
        pageSize,
        filters,
      );

      const productsData = response.value.products;

      // ✅ Normaliza os produtos para adicionar campos de compatibilidade
      const normalizedProducts = productsData.map((product) => ({
        ...product,
        // Adiciona campos de compatibilidade
        inventory: {
          quantity: product.stockQuantity,
          minStock: 10, // Valor padrão, ajuste conforme necessário
          isInStock: product.stockQuantity > 0,
        },
        images: product.imageUrl ? [product.imageUrl] : [],
        category:
          product.attributes && product.attributes.length > 0
            ? product.attributes[0].category
            : undefined,
      }));

      setProducts(normalizedProducts);
      setTotalPages(response.value.pagination.totalPages);
      setTotalItems(response.value.pagination.totalItems);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao carregar produtos: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await AdminProductService.deleteProduct(productId);
      toast.success("Produto deletado com sucesso");
      loadProducts();
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao deletar produto: ${errorMessage}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      await AdminProductService.bulkDeleteProducts(selectedProducts);
      toast.success(
        `${selectedProducts.length} produto(s) deletado(s) com sucesso`,
      );
      setSelectedProducts([]);
      loadProducts();
    } catch (error: any) {
      console.error("Failed to bulk delete products:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao deletar produtos: ${errorMessage}`);
    }
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const getStockStatus = (product: Product) => {
    if (!product.inventory?.isInStock || product.stockQuantity === 0)
      return "out_of_stock";
    if (product.stockQuantity <= (product.inventory?.minStock || 10))
      return "low_stock";
    return "in_stock";
  };

  const getStockBadge = (product: Product) => {
    const status = getStockStatus(product);
    switch (status) {
      case "out_of_stock":
        return <Badge variant="destructive">Sem Estoque</Badge>;
      case "low_stock":
        return (
          <Badge variant="secondary" className="text-orange-600 bg-orange-100">
            Estoque Baixo
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-green-600 bg-green-100">
            Em Estoque
          </Badge>
        );
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const getProductCategory = (product: Product): string => {
    if (product.category) {
      return typeof product.category === "string"
        ? product.category
        : EnumCategory[product.category];
    }
    if (
      product.attributes &&
      product.attributes.length > 0 &&
      product.attributes[0].category
    ) {
      return product.attributes[0].category;
    }
    return "Sem categoria";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Produtos
          </h1>
          <p className="text-gray-600">{totalItems} produto(s) encontrado(s)</p>
        </div>
        <Button onClick={() => setShowProductForm(true)} className="sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {Object.entries(EnumCategory)
                    .filter(([k, v]) => isNaN(Number(k)))
                    .map(([key, _]) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status de Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="in_stock">Em Estoque</SelectItem>
                  <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedProducts.length} selecionado(s)
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                >
                  Limpar seleção
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar Selecionados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deletar Produtos</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja deletar {selectedProducts.length}{" "}
                        produto(s)? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>
                        Deletar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === products.length &&
                          products.length > 0
                        }
                        onChange={selectAllProducts}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-600">
                            Nenhum produto encontrado
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setShowProductForm(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeiro Produto
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                product.imageUrl ||
                                product.images?.[0] ||
                                "/placeholder-product.png"
                              }
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover bg-gray-100"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500 truncate max-w-48">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getProductCategory(product)}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{product.stockQuantity} unidades</div>
                            {product.inventory?.minStock && (
                              <div className="text-gray-500">
                                Mín: {product.inventory.minStock}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStockBadge(product)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Deletar Produto
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar "
                                    {product.name}"? Esta ação não pode ser
                                    desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationPrevious
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      {currentPage < totalPages && (
                        <PaginationNext
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSave={handleProductSaved}
            onCancel={() => setShowProductForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
