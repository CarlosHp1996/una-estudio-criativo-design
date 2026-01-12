import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Copy,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import { PaymentResponse } from "@/types/api";
import { toast } from "sonner";

interface AbacatePaymentProps {
  paymentData: PaymentResponse;
  onBack: () => void;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

const AbacatePayment: React.FC<AbacatePaymentProps> = ({
  paymentData,
  onBack,
  onSuccess,
  onError,
}) => {
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Calculate time remaining
  useEffect(() => {
    if (paymentData.expiresAt) {
      const expiryTime = new Date(paymentData.expiresAt).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, expiryTime - now);
        setTimeLeft(Math.floor(remaining / 1000));

        if (remaining === 0) {
          clearInterval(interval);
          onError("Pagamento expirado. Tente novamente.");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData.expiresAt, onError]);

  // Auto-check payment status
  useEffect(() => {
    if (paymentData.billingId) {
      const interval = setInterval(async () => {
        try {
          const status = await PaymentService.getBillingStatus(
            paymentData.billingId!
          );
          if (status.status === "approved") {
            onSuccess(paymentData.transactionId);
          } else if (status.status === "failed") {
            onError("Pagamento rejeitado. Tente novamente.");
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [paymentData.billingId, paymentData.transactionId, onSuccess, onError]);

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copiado para a área de transferência!`);
    } catch (error) {
      toast.error(`Erro ao copiar ${type.toLowerCase()}`);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData.billingId) return;

    setChecking(true);
    try {
      const status = await PaymentService.getBillingStatus(
        paymentData.billingId
      );
      if (status.status === "approved") {
        onSuccess(paymentData.transactionId);
      } else if (status.status === "failed") {
        onError("Pagamento rejeitado. Tente novamente.");
      } else {
        toast.info("Pagamento ainda está pendente. Aguarde o processamento.");
      }
    } catch (error: any) {
      toast.error("Erro ao verificar status do pagamento");
    } finally {
      setChecking(false);
    }
  };

  const isPix = paymentData.pixCode || paymentData.pixQrCode;
  const isBoleto = paymentData.boletoUrl;

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        {isPix && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">PIX</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
              <p className="text-gray-600">
                Escaneie o QR Code ou copie o código
              </p>
            </div>
          </div>
        )}

        {isBoleto && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Pagamento via Boleto</h2>
              <p className="text-gray-600">
                Baixe o boleto e pague em qualquer banco
              </p>
            </div>
          </div>
        )}

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Tempo restante: {formatTimeLeft(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* PIX Payment */}
      {isPix && (
        <div className="space-y-4">
          {paymentData.pixQrCode && (
            <div className="text-center">
              <h3 className="font-medium mb-2">1. Escaneie o QR Code</h3>
              <div className="bg-white p-4 rounded-lg border inline-block">
                <img
                  src={paymentData.pixQrCode}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </div>
          )}

          {paymentData.pixCode && (
            <div>
              <h3 className="font-medium mb-2">2. Ou copie o código PIX</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentData.pixCode}
                  readOnly
                  className="flex-1 p-3 border rounded-md bg-gray-50 text-sm font-mono"
                />
                <Button
                  onClick={() =>
                    copyToClipboard(paymentData.pixCode!, "Código PIX")
                  }
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Como pagar com PIX:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Abra o app do seu banco</li>
              <li>2. Escolha a opção PIX</li>
              <li>3. Escaneie o QR Code ou cole o código</li>
              <li>4. Confirme o pagamento</li>
            </ol>
          </div>
        </div>
      )}

      {/* Boleto Payment */}
      {isBoleto && (
        <div className="space-y-4">
          <div className="text-center">
            <Button asChild className="w-full" size="lg">
              <a
                href={paymentData.boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-5 h-5 mr-2" />
                Baixar Boleto
              </a>
            </Button>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">
              Como pagar o boleto:
            </h4>
            <ol className="text-sm text-orange-800 space-y-1">
              <li>1. Baixe o boleto clicando no botão acima</li>
              <li>2. Pague em qualquer banco, lotérica ou app bancário</li>
              <li>
                3. O pagamento pode levar até 2 dias úteis para ser processado
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* External Payment Option */}
      {paymentData.paymentUrl && (
        <div className="mt-4">
          <Button asChild variant="outline" className="w-full">
            <a
              href={paymentData.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir página de pagamento
            </a>
          </Button>
        </div>
      )}

      {/* Status Check */}
      <div className="flex gap-3 mt-6">
        <Button
          onClick={checkPaymentStatus}
          disabled={checking}
          className="flex-1"
        >
          {checking ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Já paguei
            </>
          )}
        </Button>

        <Button onClick={onBack} variant="outline">
          Voltar
        </Button>
      </div>
    </Card>
  );
};

export default AbacatePayment;
