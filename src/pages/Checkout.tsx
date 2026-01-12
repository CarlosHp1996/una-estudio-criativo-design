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
import CreditCardForm from "@/components/forms/CreditCardForm";
import AbacatePayment from "@/components/AbacatePayment";
import {
  CreateOrderRequest,
  ShippingAddress,
  PaymentRequest,
  CardDetails,
} from "@/types/api";
import { toast } from "sonner";

type CheckoutStep = "shipping" | "payment" | "processing" | "abacate";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
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
      setCreatedOrder(order);

      // Move to payment step based on payment method
      if (formData.paymentMethod === "credit") {
        setCurrentStep("payment");
        toast.success("Pedido criado! Agora processe o pagamento.");
      } else if (PaymentService.isRedirectPayment(formData.paymentMethod)) {
        // PIX/Boleto - create AbacatePay billing
        try {
          const billingResponse = await PaymentService.createBilling({
            orderId: order.id,
            amount: total,
            paymentMethod: formData.paymentMethod as "pix" | "boleto",
            returnUrl: `${window.location.origin}/checkout`,
            completionUrl: `${window.location.origin}/pedidos/${order.id}`,
          });

          // Store billing response for AbacatePayment component
          setCreatedOrder({
            ...order,
            billingResponse,
          });

          setCurrentStep("abacate");
          toast.success(
            `${
              formData.paymentMethod === "pix" ? "PIX" : "Boleto"
            } gerado com sucesso!`
          );
        } catch (billingError: any) {
          console.error("Billing creation error:", billingError);
          toast.error(
            billingError.message || "Erro ao gerar pagamento. Tente novamente."
          );
        }
      } else {
        // Other payment methods
        await clearCart();
        toast.success(`Pedido ${order.orderNumber} criado com sucesso!`);
        navigate(`/pedidos/${order.id}`, { state: { orderCreated: true } });
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

  const handlePaymentSubmit = async (cardDetails: CardDetails) => {
    if (!createdOrder) {
      toast.error("Erro: Pedido não encontrado.");
      return;
    }

    setCurrentStep("processing");
    setIsLoading(true);

    try {
      const paymentRequest: PaymentRequest = {
        orderId: createdOrder.id,
        paymentMethod: "credit_card",
        amount: total,
        cardDetails,
      };

      const paymentResponse = await PaymentService.processPayment(
        paymentRequest
      );

      if (paymentResponse.status === "approved") {
        // Payment successful
        await clearCart();
        toast.success(
          `Pagamento aprovado! Pedido ${createdOrder.orderNumber} confirmado.`
        );
        navigate(`/pedidos/${createdOrder.id}`, {
          state: {
            orderCreated: true,
            paymentApproved: true,
            transactionId: paymentResponse.transactionId,
          },
        });
      } else if (paymentResponse.status === "pending") {
        toast.info(
          "Pagamento em processamento. Você será notificado sobre o resultado."
        );
        navigate(`/pedidos/${createdOrder.id}`, {
          state: {
            orderCreated: true,
            paymentPending: true,
          },
        });
      } else {
        // Payment failed
        toast.error(`Pagamento rejeitado: ${paymentResponse.message}`);
        setCurrentStep("payment"); // Allow retry
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(
        error.message || "Erro ao processar pagamento. Tente novamente."
      );
      setCurrentStep("payment"); // Allow retry
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setCurrentStep("shipping");
    setCreatedOrder(null);
  };

  const handleAbacateBack = () => {
    setCurrentStep("shipping");
    setCreatedOrder(null);
  };

  const handleAbacateSuccess = async (transactionId: string) => {
    await clearCart();
    toast.success(
      `Pagamento aprovado! Pedido ${createdOrder?.orderNumber} confirmado.`
    );
    navigate(`/pedidos/${createdOrder?.id}`, {
      state: {
        orderCreated: true,
        paymentApproved: true,
        transactionId,
      },
    });
  };

  const handleAbacateError = (error: string) => {
    toast.error(error);
    setCurrentStep("shipping");
    setCreatedOrder(null);
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
            currentStep === "payment" || currentStep === "abacate"
              ? "text-primary"
              : "text-gray-500"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "payment" || currentStep === "abacate"
                ? "bg-primary text-white"
                : currentStep === "processing"
                ? "bg-green-500 text-white"
                : "bg-gray-200"
            }`}
          >
            {currentStep === "processing" ? "✓" : "2"}
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
                  key={`${item.id}-${item.size || "default"}`}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.size && (
                      <p className="text-sm text-gray-600">
                        Tamanho: {item.size}
                      </p>
                    )}
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
                  <option value="boleto">Boleto</option>
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

  const renderPaymentForm = () => (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pagamento</h2>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">
            Pedido #{createdOrder?.orderNumber}
          </h3>
          <div className="flex justify-between text-lg font-bold">
            <span>Total a pagar:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <CreditCardForm
          onSubmit={handlePaymentSubmit}
          onCancel={handlePaymentCancel}
          loading={isLoading}
        />
      </Card>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Spinner className="h-12 w-12 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Processando Pagamento</h2>
      <p className="text-gray-600 text-center">
        Aguarde enquanto processamos seu pagamento.
        <br />
        Isso pode levar alguns segundos.
      </p>
    </div>
  );

  const renderAbacatePayment = () => {
    if (!createdOrder?.billingResponse) {
      return (
        <div className="text-center">
          <p>Erro: Dados de pagamento não encontrados.</p>
          <Button onClick={handleAbacateBack} className="mt-4">
            Voltar
          </Button>
        </div>
      );
    }

    return (
      <AbacatePayment
        paymentData={createdOrder.billingResponse}
        onBack={handleAbacateBack}
        onSuccess={handleAbacateSuccess}
        onError={handleAbacateError}
      />
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
        {currentStep === "payment" && renderPaymentForm()}
        {currentStep === "processing" && renderProcessing()}
        {currentStep === "abacate" && renderAbacatePayment()}
      </div>
    </div>
  );
};

export default Checkout;
