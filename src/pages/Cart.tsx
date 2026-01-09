import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const Cart = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    total,
    totalItems,
    isLoading,
    error,
    clearCart,
  } = useCart();

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div>
              <Card className="p-6">
                <Skeleton className="h-6 w-40 mb-6" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            Seu carrinho está vazio
          </h1>
          <p className="text-muted-foreground mb-8">
            Adicione alguns produtos incríveis para começar suas compras!
          </p>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button asChild size="lg">
            <Link to="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8">
          Meu Carrinho
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">
                      {item.name}
                    </h3>
                    <p className="text-lg font-semibold text-primary mb-3">
                      R$ {item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                    <p className="font-semibold text-foreground">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Resumo do Pedido
              </h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span>Calculado no checkout</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-semibold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full mb-3" size="lg">
                <Link to="/checkout">Finalizar Compra</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/produtos">Continuar Comprando</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
