import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { memo, useCallback, useRef, useMemo } from "react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useIntersectionObserver } from "@/hooks/useOptimization";
import { ProductCardSkeleton } from "@/components/ui/smart-skeleton";
import { ShoppingCart, Heart } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  lazy?: boolean;
  originalPrice?: number;
  stock?: number;
  rating?: number;
  onFavorite?: (productId: string) => void;
  isFavorited?: boolean;
}

const ProductCard = memo(
  ({
    id,
    name,
    price,
    image,
    category,
    lazy = true,
    originalPrice,
    stock,
    rating,
    onFavorite,
    isFavorited = false,
  }: ProductCardProps) => {
    const { addItem } = useCart();
    const cardRef = useRef<HTMLDivElement>(null);

    // Intersection observer for lazy loading
    const { isIntersecting } = useIntersectionObserver(cardRef, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    // Memoized calculations
    const productMetrics = useMemo(() => {
      const discountPercentage = originalPrice
        ? Math.round((1 - price / originalPrice) * 100)
        : 0;

      const isLowStock = stock !== undefined && stock <= 5 && stock > 0;
      const isOutOfStock = stock === 0;

      return {
        discountPercentage,
        isLowStock,
        isOutOfStock,
      };
    }, [originalPrice, price, stock]);

    // Optimized cart item
    const cartItem = useMemo(
      () => ({
        id,
        name,
        price,
        image,
        quantity: 1,
      }),
      [id, name, price, image]
    );

    const handleAddToCart = useCallback(() => {
      try {
        addItem(cartItem);
        toast.success("Produto adicionado ao carrinho!");
      } catch (error) {
        toast.error("Erro ao adicionar produto ao carrinho");
      }
    }, [addItem, cartItem]);

    const handleFavorite = useCallback(() => {
      try {
        onFavorite?.(id);
        const message = isFavorited
          ? "Removido dos favoritos"
          : "Adicionado aos favoritos";
        toast.info(message);
      } catch (error) {
        toast.error("Erro ao atualizar favoritos");
      }
    }, [onFavorite, id, isFavorited]);

    // Show skeleton while not intersecting (if lazy loading is enabled)
    if (lazy && !isIntersecting) {
      return (
        <div ref={cardRef}>
          <ProductCardSkeleton />
        </div>
      );
    }

    return (
      <Card
        ref={cardRef}
        className="group overflow-hidden border-border hover:shadow-elegant transition-smooth transform hover:-translate-y-1"
      >
        {/* Product Image */}
        <div className="relative">
          <Link to={`/produto/${id}`}>
            <div className="aspect-square overflow-hidden bg-muted">
              <OptimizedImage
                src={image}
                alt={name}
                className="w-full h-full group-hover:scale-105 transition-smooth object-cover"
                width={300}
                height={300}
                priority={!lazy}
              />
            </div>
          </Link>

          {/* Discount Badge */}
          {productMetrics.discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
              -{productMetrics.discountPercentage}%
            </div>
          )}

          {/* Stock Badges */}
          {productMetrics.isLowStock && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
              Só {stock} restantes!
            </div>
          )}

          {productMetrics.isOutOfStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
              Esgotado
            </div>
          )}

          {/* Favorite Button */}
          {onFavorite && (
            <button
              onClick={handleFavorite}
              className={`absolute bottom-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 transform hover:scale-110 shadow-lg ${
                isFavorited
                  ? "text-red-500"
                  : "text-gray-600 hover:text-red-500"
              }`}
              aria-label={
                isFavorited
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isFavorited ? "fill-current scale-110" : ""
                }`}
              />
            </button>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {category}
          </p>
          <Link to={`/produto/${id}`}>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-smooth line-clamp-2 min-h-[2.5rem]">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1 mt-2 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < Math.floor(rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-1">
                {rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-lg font-semibold text-primary">
              R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                R${" "}
                {originalPrice.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={productMetrics.isOutOfStock}
            className="w-full transition-all duration-200 hover:shadow-lg"
            variant="default"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {productMetrics.isOutOfStock ? "Esgotado" : "Adicionar ao Carrinho"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
