import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { OrderService } from "@/services/orderService";
import { CreateOrderRequest, ShippingAddress } from "@/types/api";
import { toast } from "sonner";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.userName || "",
    email: user?.email || "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    paymentMethod: "credit",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para finalizar a compra.");
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.");
      navigate("/carrinho");
      return;
    }

    setIsLoading(true);

    try {
      const shippingAddress: ShippingAddress = {
        street: `${formData.street}, ${formData.number}${
          formData.complement ? `, ${formData.complement}` : ""
        }`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.cep,
        country: "Brasil",
      };

      const orderRequest: CreateOrderRequest = {
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      const order = await OrderService.createOrder(orderRequest);

      // Clear cart after successful order
      await clearCart();

      toast.success(`Pedido ${order.orderNumber} criado com sucesso!`);

      // Navigate to order confirmation page
      navigate(`/pedidos/${order.id}`, {
        state: { orderCreated: true },
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(
        error.message || "Erro ao processar pedido. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (items.length === 0) {
    navigate("/carrinho");
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8">
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Data */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Dados Pessoais
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Address */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Endereço de Entrega
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      name="cep"
                      required
                      value={formData.cep}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="street">Endereço</Label>
                      <Input
                        id="street"
                        name="street"
                        required
                        value={formData.street}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        name="number"
                        required
                        value={formData.number}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      name="complement"
                      value={formData.complement}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Forma de Pagamento
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit"
                      checked={formData.paymentMethod === "credit"}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <span>Cartão de Crédito</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={formData.paymentMethod === "pix"}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <span>PIX</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="boleto"
                      checked={formData.paymentMethod === "boleto"}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <span>Boleto Bancário</span>
                  </label>
                </div>
              </Card>

              {/* Order Notes */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Observações (Opcional)
                </h2>
                <div>
                  <Label htmlFor="notes">
                    Instruções de entrega ou observações
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: Deixar com o porteiro, apartamento no 2º andar..."
                  />
                </div>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading || items.length === 0}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processando Pedido...
                  </>
                ) : (
                  `Finalizar Pedido - R$ ${total.toFixed(2)}`
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Resumo do Pedido
              </h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-foreground font-medium">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-semibold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
