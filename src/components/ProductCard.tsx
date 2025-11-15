import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

const ProductCard = ({ id, name, price, image, category }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image,
      quantity: 1,
    });
    toast.success("Produto adicionado ao carrinho!");
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-elegant transition-smooth">
      <Link to={`/produto/${id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {category}
        </p>
        <Link to={`/produto/${id}`}>
          <h3 className="font-medium text-foreground group-hover:text-primary transition-smooth">
            {name}
          </h3>
        </Link>
        <p className="text-lg font-semibold text-primary mt-2">
          R$ {price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          className="w-full"
          variant="default"
        >
          Adicionar ao Carrinho
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
