import React from "react";
import { useCart } from "@/contexts/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AddedToCartSheet = () => {
  const { isAddedToCartOpen, setIsAddedToCartOpen, lastAddedItem } = useCart();
  const navigate = useNavigate();

  if (!lastAddedItem) return null;

  return (
    <Sheet open={isAddedToCartOpen} onOpenChange={setIsAddedToCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white border-l shadow-2xl">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="h-5 w-5 fill-current" />
            <span className="font-semibold">Adicionado ao carrinho!</span>
          </div>
          <SheetTitle className="text-xl font-serif">Seu Carrinho</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-8">
          <div className="flex gap-6 items-start">
            <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden border border-border/50">
              <img
                src={lastAddedItem.image || "/placeholder-product.png"}
                alt={lastAddedItem.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-medium text-foreground mb-1 truncate leading-tight">
                {lastAddedItem.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Quantidade: {lastAddedItem.quantity}
              </p>
              <p className="text-lg font-bold text-primary">
                R$ {(lastAddedItem.price * lastAddedItem.quantity).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-10 p-5 bg-muted/30 rounded-xl border border-border/40">
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingCart className="h-4 w-4" />
              Por que comprar na Una?
            </h5>
            <ul className="space-y-2.5 text-sm text-muted-foreground italic">
              <li>• Entrega rápida e segura</li>
              <li>• Parcelamento em até 10x</li>
              <li>• 7 dias para devolução gratuita</li>
              <li>• Peças exclusivas e artesanais</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4 pt-6 mt-auto border-t">
          <Button
            className="w-full h-14 text-lg font-bold uppercase tracking-wide group"
            onClick={() => {
              setIsAddedToCartOpen(false);
              navigate("/carrinho");
            }}
          >
            Ir para o Carrinho
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              className="w-full h-14 text-lg font-medium border-2 hover:bg-muted transition-colors"
            >
              Continuar Comprando
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};
