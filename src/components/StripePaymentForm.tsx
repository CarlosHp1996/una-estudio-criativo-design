import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// Singleton — o loadStripe NUNCA deve ser chamado dentro do componente (recriaria a instância a cada render).
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || ""
);

interface StripePaymentFormProps {
  clientSecret: string;
  amount?: number;
  onSuccess: (paymentIntentId?: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

/**
 * Formulário de pagamento Stripe (cartão + PIX).
 * O PaymentElement decide automaticamente quais métodos exibir com base no
 * PaymentIntent criado no backend (que já habilita cartão e PIX).
 */
const StripeCheckoutInner: React.FC<
  Omit<StripePaymentFormProps, "clientSecret">
> = ({ amount, onSuccess, onError, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js ainda não carregou.
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        const message =
          result.error.message ||
          "Não foi possível confirmar o pagamento. Tente novamente.";
        toast.error(message);
        onError(message);
        return;
      }

      const status = result.paymentIntent?.status;

      if (status === "succeeded" || status === "processing") {
        toast.success(
          status === "succeeded"
            ? "Pagamento aprovado!"
            : "Pagamento em processamento. Você será notificado sobre o resultado."
        );
        onSuccess(result.paymentIntent?.id);
      } else {
        const message = `Pagamento não concluído (status: ${status ?? "desconhecido"}).`;
        toast.error(message);
        onError(message);
      }
    } catch (error: any) {
      const message =
        error?.message || "Erro inesperado ao processar o pagamento.";
      toast.error(message);
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Pagamento
        </CardTitle>
        {amount !== undefined && (
          <div className="text-sm text-muted-foreground">
            Valor: R${" "}
            {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Seus dados de pagamento são processados diretamente pela Stripe
              e nunca passam pelo nosso servidor.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={!stripe || !elements || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processando...
                </>
              ) : (
                "Pagar Agora"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  amount,
  onSuccess,
  onError,
  onBack,
}) => {
  if (!clientSecret) {
    return (
      <div className="text-center">
        <p>Erro: dados de pagamento não encontrados.</p>
        <Button onClick={onBack} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutInner
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
      />
    </Elements>
  );
};

export default StripePaymentForm;
