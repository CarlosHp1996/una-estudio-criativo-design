import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PaymentService } from "@/services/paymentService";
import { Payment } from "@/types/api";
import { toast } from "sonner";

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.getPaymentHistory();
      setPayments(response.items); // Corrigido: usar response.items ao invés de response.payments
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Erro ao carregar histórico de pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "pending":
        return "Pendente";
      case "rejected":
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Cartão de Crédito";
      case "pix":
        return "PIX";
      case "boleto":
        return "Boleto";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600 mb-4">Nenhum pagamento encontrado</p>
        <Button onClick={fetchPayments}>Atualizar</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Histórico de Pagamentos</h2>
        <Button onClick={fetchPayments} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {payments.map((payment) => (
        <Card key={payment.id} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Pedido</h3>
              <p className="text-gray-600">#{payment.orderId}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Valor</h3>
              <p className="text-lg font-semibold">
                R$ {payment.amount.toFixed(2)}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Método</h3>
              <p className="text-gray-600">
                {formatPaymentMethod(payment.method)}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Status</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  payment.status
                )}`}
              >
                {getStatusText(payment.status)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Data do Pagamento</h3>
              <p className="text-gray-600">{formatDate(payment.createdAt)}</p>
            </div>

            {payment.transactionId && (
              <div>
                <h3 className="font-medium text-gray-900">ID da Transação</h3>
                <p className="text-gray-600 font-mono text-sm">
                  {payment.transactionId}
                </p>
              </div>
            )}

            {payment.billingId && (
              <div>
                <h3 className="font-medium text-gray-900">ID AbacatePay</h3>
                <p className="text-gray-600 font-mono text-sm">
                  {payment.billingId}
                </p>
              </div>
            )}

            {payment.pixCode && (
              <div>
                <h3 className="font-medium text-gray-900">Código PIX</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() =>
                    navigator.clipboard.writeText(payment.pixCode!)
                  }
                >
                  Copiar código PIX
                </Button>
              </div>
            )}

            {payment.boletoUrl && (
              <div>
                <h3 className="font-medium text-gray-900">Boleto</h3>
                <Button variant="outline" size="sm" className="mt-1" asChild>
                  <a
                    href={payment.boletoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Baixar Boleto
                  </a>
                </Button>
              </div>
            )}

            {payment.paymentUrl && (
              <div>
                <h3 className="font-medium text-gray-900">Link de Pagamento</h3>
                <Button variant="outline" size="sm" className="mt-1" asChild>
                  <a
                    href={payment.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir pagamento
                  </a>
                </Button>
              </div>
            )}

            {payment.message && (
              <div className="md:col-span-2">
                <h3 className="font-medium text-gray-900">Observações</h3>
                <p className="text-gray-600">{payment.message}</p>
              </div>
            )}
          </div>

          {payment.status === "pending" && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-yellow-600">
                ⏳ Este pagamento ainda está sendo processado. Você será
                notificado quando o processamento for concluído.
              </p>
            </div>
          )}

          {payment.status === "rejected" && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-red-600">
                ❌ Este pagamento foi rejeitado. Entre em contato com o suporte
                se precisar de mais informações.
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default PaymentHistory;
