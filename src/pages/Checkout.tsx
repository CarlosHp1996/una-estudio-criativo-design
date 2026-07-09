import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { OrderService } from "@/services/orderService";
import { PaymentService } from "@/services/paymentService";
import StripePaymentForm from "@/components/StripePaymentForm";
import type {
  AddressDto,
  CreateOrderApiRequest,
  UpdateProfileRequest,
} from "@/types/api";
import { BRAZIL_STATES, ufToEnumState } from "@/lib/brazilStates";
import {
  buildAddressesPayload,
  formatAddressLine,
  resolveNewAddressId,
} from "@/lib/checkoutAddress";
import { toast } from "sonner";

// Fluxo antigo (AbacatePay) tinha um step "payment" com CreditCardForm (dados de cartão
// crus enviados ao backend) e um step "processing" separado. Hoje cartão e PIX passam
// pelo mesmo fluxo Stripe (StripePaymentForm), então esses steps deixaram de existir.
type CheckoutStep = "shipping" | "stripe";

// Valor especial do RadioGroup que representa a opção "cadastrar novo endereço".
const NEW_ADDRESS_OPTION = "__new__";

const emptyNewAddress = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  uf: "",
};

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.userName || "",
    email: user?.email || "",
    phone: "",
    paymentMethod: "credit",
    notes: "",
  });

  // --- Etapa de endereço ---
  const savedAddresses = useMemo(
    () => user?.addresses ?? [],
    [user?.addresses]
  );
  const hasSavedAddresses = savedAddresses.length > 0;

  // Modo de endereço: usar um existente ou cadastrar um novo.
  const [addressMode, setAddressMode] = useState<"existing" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addressInitialized, setAddressInitialized] = useState(false);
  const [newAddr, setNewAddr] = useState(emptyNewAddress);

  // Quando os endereços do usuário chegam (o perfil carrega de forma assíncrona),
  // pré-seleciona o principal (ou o primeiro) e entra no modo "existente".
  useEffect(() => {
    if (addressInitialized) return;
    if (savedAddresses.length > 0) {
      const main =
        savedAddresses.find((a) => a.mainAddress) ?? savedAddresses[0];
      setSelectedAddressId(main.id ?? "");
      setAddressMode("existing");
      setAddressInitialized(true);
    }
  }, [savedAddresses, addressInitialized]);

  const handleAddressModeChange = (value: string) => {
    if (value === NEW_ADDRESS_OPTION) {
      setAddressMode("new");
    } else {
      setAddressMode("existing");
      setSelectedAddressId(value);
    }
  };

  const handleNewAddrChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewAddr((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Resolve o `addressId` a ser usado no pedido:
   *  - modo "existente": devolve o id selecionado;
   *  - modo "novo": valida o formulário, salva via PUT /Auth/update (reenviando os
   *    endereços existentes + o novo com Guid.Empty) e extrai o Id do endereço
   *    recém-criado da resposta.
   * Retorna null (após exibir um toast) quando não é possível obter um id confiável.
   */
  const resolveAddressId = async (): Promise<string | null> => {
    if (addressMode === "existing") {
      if (!selectedAddressId) {
        toast.error("Selecione um endereço de entrega.");
        return null;
      }
      return selectedAddressId;
    }

    // Modo "novo endereço" — validação dos campos obrigatórios.
    const cep = newAddr.cep.trim();
    const street = newAddr.street.trim();
    const number = newAddr.number.trim();
    const neighborhood = newAddr.neighborhood.trim();
    const city = newAddr.city.trim();
    const uf = newAddr.uf.trim();

    if (!cep || !street || !number || !neighborhood || !city || !uf) {
      toast.error(
        "Preencha CEP, rua, número, bairro, cidade e UF do endereço."
      );
      return null;
    }

    const stateValue = ufToEnumState(uf);
    if (stateValue === undefined) {
      toast.error("Selecione uma UF válida.");
      return null;
    }

    if (!user?.id) {
      toast.error("Sessão inválida. Faça login novamente.");
      return null;
    }

    const previousIds = savedAddresses.map((a) => a.id);
    const newAddress: AddressDto = {
      street,
      number,
      complement: newAddr.complement.trim() || undefined,
      neighborhood,
      city,
      state: stateValue,
      zipCode: cep,
      completName: formData.name.trim() || user.userName,
      // Se ainda não há nenhum endereço, o novo vira o principal.
      mainAddress: savedAddresses.length === 0,
    };

    const payload: UpdateProfileRequest = {
      id: user.id,
      addresses: buildAddressesPayload(savedAddresses, newAddress),
    };

    try {
      const response = await updateProfile(payload);
      const returnedAddresses: AddressDto[] =
        response?.value?.user?.addresses ?? [];

      const newId = resolveNewAddressId(previousIds, returnedAddresses);
      if (!newId) {
        toast.error(
          "Endereço salvo, mas não foi possível confirmá-lo. Tente novamente."
        );
        return null;
      }
      return newId;
    } catch (error: any) {
      console.error("Address save error:", error);
      toast.error(
        error?.message || "Não foi possível salvar o endereço. Tente novamente."
      );
      return null;
    }
  };

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

    if (!user?.id) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsLoading(true);

    try {
      // Garante um AddressId de um endereço salvo (o backend POST /orders/create
      // exige AddressId — não aceita endereço em texto livre).
      const addressId = await resolveAddressId();
      if (!addressId) {
        // resolveAddressId já exibiu o toast apropriado.
        return;
      }

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

  const renderNewAddressForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cep">CEP *</Label>
          <Input
            id="cep"
            name="cep"
            value={newAddr.cep}
            onChange={handleNewAddrChange}
            placeholder="00000-000"
          />
        </div>
        <div>
          <Label htmlFor="street">Rua *</Label>
          <Input
            id="street"
            name="street"
            value={newAddr.street}
            onChange={handleNewAddrChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            name="number"
            value={newAddr.number}
            onChange={handleNewAddrChange}
          />
        </div>
        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            name="complement"
            value={newAddr.complement}
            onChange={handleNewAddrChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="neighborhood">Bairro *</Label>
        <Input
          id="neighborhood"
          name="neighborhood"
          value={newAddr.neighborhood}
          onChange={handleNewAddrChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            name="city"
            value={newAddr.city}
            onChange={handleNewAddrChange}
          />
        </div>
        <div>
          <Label htmlFor="uf">UF *</Label>
          <Select
            value={newAddr.uf}
            onValueChange={(value) =>
              setNewAddr((prev) => ({ ...prev, uf: value }))
            }
          >
            <SelectTrigger id="uf">
              <SelectValue placeholder="Selecione a UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZIL_STATES.map((s) => (
                <SelectItem key={s.uf} value={s.uf}>
                  {s.uf} - {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderAddressSection = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Endereço de Entrega</h3>

      {hasSavedAddresses ? (
        <>
          <RadioGroup
            value={
              addressMode === "existing"
                ? selectedAddressId
                : NEW_ADDRESS_OPTION
            }
            onValueChange={handleAddressModeChange}
            className="space-y-2"
          >
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                htmlFor={`addr-${address.id}`}
                className="flex items-start gap-3 border rounded-md p-3 cursor-pointer hover:bg-gray-50"
              >
                <RadioGroupItem
                  value={address.id ?? ""}
                  id={`addr-${address.id}`}
                  className="mt-1"
                />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800">{formatAddressLine(address)}</p>
                  {address.mainAddress && (
                    <span className="inline-block mt-1 text-xs font-medium text-primary">
                      Endereço principal
                    </span>
                  )}
                </div>
              </label>
            ))}

            <label
              htmlFor="addr-new"
              className="flex items-center gap-3 border rounded-md p-3 cursor-pointer hover:bg-gray-50"
            >
              <RadioGroupItem value={NEW_ADDRESS_OPTION} id="addr-new" />
              <span className="text-sm font-medium">Usar um novo endereço</span>
            </label>
          </RadioGroup>

          {addressMode === "new" && (
            <div className="pt-2">{renderNewAddressForm()}</div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Você ainda não tem endereços salvos. Cadastre o endereço de entrega
            abaixo.
          </p>
          {renderNewAddressForm()}
        </>
      )}
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

              {renderAddressSection()}

              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
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
