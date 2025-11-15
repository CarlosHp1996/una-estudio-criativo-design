import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button asChild>
            <Link to="/produtos">Voltar para Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
    toast.success(`${quantity} ${quantity > 1 ? "itens adicionados" : "item adicionado"} ao carrinho!`);
  };

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
                  <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
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
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
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
              <h3 className="font-semibold text-foreground mb-2">Detalhes do Produto</h3>
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
