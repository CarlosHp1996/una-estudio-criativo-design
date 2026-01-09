import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ChevronLeft, Minus, Plus, Star, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductService from "@/services/productService";
import type { Product } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const productData = await ProductService.getProductById(id);
        setProduct(productData);

        // Load related products (recommendations)
        try {
          const recommendations = await ProductService.getRecommendations(
            id,
            4
          );
          setRelatedProducts(recommendations);
        } catch (relatedError) {
          console.warn("Failed to load recommendations:", relatedError);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        const errorMessage = parseApiError(error as any).message;
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    await addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity,
      productId: product.id,
    });

    // Toast is handled by the CartContext now
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-32 mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images Skeleton */}
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-20 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-8 w-32" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <h1 className="text-2xl font-bold">
            {error ? "Erro ao carregar produto" : "Produto não encontrado"}
          </h1>
          <Button asChild>
            <Link to="/produtos">Voltar para Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/produtos">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar para Produtos
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* Images */}
          <div>
            <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-smooth ${
                    selectedImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              {product.category}
            </p>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-primary mb-6">
              R$ {product.price.toFixed(2)}
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Quantidade
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleAddToCart} size="lg" className="w-full">
              Adicionar ao Carrinho
            </Button>

            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">
                Detalhes do Produto
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Pintado à mão</li>
                <li>• Peça única e exclusiva</li>
                <li>• Material de alta qualidade</li>
                <li>• Embalagem especial para presente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
              Produtos Relacionados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
