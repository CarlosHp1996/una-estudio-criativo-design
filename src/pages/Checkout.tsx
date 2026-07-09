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
import { PaymentService } from "@/services/paymentService";
import StripePaymentForm from "@/components/StripePaymentForm";
import { CreateOrderApiRequest } from "@/types/api";
import { toast } from "sonner";

// Fluxo antigo (AbacatePay) tinha um step "payment" com CreditCardForm (dados de cartão
// crus enviados ao backend) e um step "processing" separado. Hoje cartão e PIX passam
// pelo mesmo fluxo Stripe (StripePaymentForm), então esses steps deixaram de existir.
type CheckoutStep = "shipping" | "stripe";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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

  const handleShippingSubmit = async (e: React.FormEvent) => {
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

    // O backend (POST /orders/create) exige um AddressId de um endereco JA salvo
    // no perfil do usuario — nao aceita endereco em texto livre. O formulario de
    // entrega acima ainda coleta nome/email/telefone (usados no pagamento), mas a
    // rua/cidade/CEP digitados aqui NAO sao enviados no pedido.
    // TODO backend/checkout: adicionar selecao/cadastro de endereco (AddressId) neste fluxo.
    const addressId =
      user?.addresses?.find((a) => a.mainAddress)?.id ??
      user?.addresses?.[0]?.id ??
      "";

    if (!user?.id || !addressId) {
      toast.error(
        "Cadastre um endereco no seu perfil antes de finalizar a compra."
      );
      return;
    }

    setIsLoading(true);

    try {
      const orderRequest: CreateOrderApiRequest = {
        userId: user.id,
        addressId,
        paymentMethod: formData.paymentMethod === "pix" ? "pix" : "card",
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const order = await OrderService.createOrder(orderRequest);
      setCreatedOrder(order);

      // Cartão e PIX agora seguem o mesmo fluxo: cria o PaymentIntent no Stripe via backend
      // e usa o clientSecret retornado para confirmar o pagamento com Stripe Elements.
      try {
        const paymentResponse = await PaymentService.createPayment({
          orderId: order.id,
          amount: total,
          paymentMethod: formData.paymentMethod === "pix" ? "pix" : "card",
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          returnUrl: `${window.location.origin}/checkout`,
        });

        if (!paymentResponse.clientSecret) {
          throw new Error(
            "Pagamento criado, mas sem clientSecret retornado pelo servidor."
          );
        }

        setClientSecret(paymentResponse.clientSecret);
        setCurrentStep("stripe");
      } catch (paymentError: any) {
        console.error("Payment creation error:", paymentError);
        toast.error(
          paymentError.message || "Erro ao iniciar pagamento. Tente novamente."
        );
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(
        error.message || "Erro ao processar pedido. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeBack = () => {
    setCurrentStep("shipping");
    setCreatedOrder(null);
    setClientSecret(null);
  };

  const handleStripeSuccess = async (paymentIntentId?: string) => {
    await clearCart();
    toast.success(
      `Pagamento aprovado! Pedido ${createdOrder?.orderNumber} confirmado.`
    );
    navigate(`/pedidos/${createdOrder?.id}`, {
      state: {
        orderCreated: true,
        paymentApproved: true,
        transactionId: paymentIntentId,
      },
    });
  };

  const handleStripeError = (error: string) => {
    toast.error(error);
    setCurrentStep("shipping");
    setCreatedOrder(null);
    setClientSecret(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Shipping Step */}
        <div
          className={`flex items-center ${
            currentStep === "shipping" ? "text-primary" : "text-gray-500"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "shipping"
                ? "bg-primary text-white"
                : createdOrder
                ? "bg-green-500 text-white"
                : "bg-gray-200"
            }`}
          >
            {createdOrder ? "✓" : "1"}
          </div>
          <span className="ml-2">Entrega</span>
        </div>

        {/* Arrow */}
        <div className="text-gray-400">→</div>

        {/* Payment Step */}
        <div
          className={`flex items-center ${
            currentStep === "stripe" ? "text-primary" : "text-gray-500"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "stripe" ? "bg-primary text-white" : "bg-gray-200"
            }`}
          >
            2
          </div>
          <span className="ml-2">Pagamento</span>
        </div>
      </div>
    </div>
  );

  const renderShippingForm = () => (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Informações de Entrega
            </h2>
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="credit">Cartão de Crédito</option>
                  <option value="pix">PIX</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processando...
                  </>
                ) : (
                  "Continuar para Pagamento"
                )}
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStripePayment = () => {
    if (!clientSecret) {
      return (
        <div className="text-center">
          <p>Erro: Dados de pagamento não encontrados.</p>
          <Button onClick={handleStripeBack} className="mt-4">
            Voltar
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto p-4">
        {/* Order Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
          <h3 className="font-medium mb-2">
            Pedido #{createdOrder?.orderNumber}
          </h3>
          <div className="flex justify-between text-lg font-bold">
            <span>Total a pagar:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <StripePaymentForm
          clientSecret={clientSecret}
          amount={total}
          onBack={handleStripeBack}
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Finalizar Compra
        </h1>

        {renderStepIndicator()}

        {currentStep === "shipping" && renderShippingForm()}
        {currentStep === "stripe" && renderStripePayment()}
      </div>
    </div>
  );
};

export default Checkout;
