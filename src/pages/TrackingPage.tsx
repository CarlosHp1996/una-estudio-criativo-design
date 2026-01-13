import React, { useState, useEffect } from "react";
import { Search, Package, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { TrackingService } from "../services/trackingService";
import { Tracking } from "../types/api";
import { TrackingTimeline } from "../components/TrackingTimeline";
import { useToast } from "../hooks/use-toast";
import { useTrackingPolling } from "../hooks/useTrackingPolling";

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState("");
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Auto-polling for status updates when tracking is displayed
  const {
    tracking: pollingTracking,
    isPolling,
    startPolling,
    stopPolling,
  } = useTrackingPolling({
    trackingCode: tracking?.trackingCode,
    enabled:
      !!tracking && !["delivered", "cancelled"].includes(tracking.status),
    pollingInterval: 30000, // Check every 30 seconds
    onStatusChange: (oldStatus, newStatus, updatedTracking) => {
      setTracking(updatedTracking);
      console.log(`Status changed from ${oldStatus} to ${newStatus}`);
    },
  });

  // Check for tracking code in URL params
  useEffect(() => {
    const codigo = searchParams.get("codigo");
    if (codigo) {
      setTrackingCode(codigo);
      // Auto-search if code is provided via URL
      searchTrackingCode(codigo);
    }
  }, [searchParams]);

  const searchTrackingCode = async (code: string) => {
    if (!code.trim()) {
      setError("Por favor, digite um código de rastreamento válido");
      return;
    }

    setLoading(true);
    setError("");
    setTracking(null);

    try {
      const trackingData = await TrackingService.getTrackingByCode(code.trim());
      setTracking(trackingData);

      toast({
        title: "Rastreamento encontrado",
        description: `Código ${code} localizado com sucesso`,
      });
    } catch (error: any) {
      console.error("Error tracking package:", error);

      if (error.response?.status === 404) {
        setError(
          "Código de rastreamento não encontrado. Verifique o código e tente novamente."
        );
      } else {
        setError(
          "Erro ao buscar rastreamento. Tente novamente em alguns minutos."
        );
      }

      toast({
        title: "Erro na busca",
        description: "Não foi possível encontrar o rastreamento solicitado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchTrackingCode(trackingCode);
  };

  const handleClearSearch = () => {
    setTrackingCode("");
    setTracking(null);
    setError("");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Rastrear Encomenda
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Digite o código de rastreamento para acompanhar o status da sua
          encomenda em tempo real
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Rastreamento
          </CardTitle>
          <CardDescription>
            Insira o código fornecido no e-mail de confirmação do pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Ex: UNA123456789BR"
                  value={trackingCode}
                  onChange={(e) =>
                    setTrackingCode(e.target.value.toUpperCase())
                  }
                  disabled={loading}
                  className="text-center font-mono text-lg"
                  maxLength={20}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !trackingCode.trim()}
                className="px-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Buscando..." : "Rastrear"}
              </Button>
            </div>

            {trackingCode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSearch}
                className="w-full"
              >
                Limpar Busca
              </Button>
            )}
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {tracking && (
        <div className="space-y-6">
          {/* Package Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {tracking.trackingCode}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${TrackingService.getStatusColor(
                      tracking.status
                    )} font-semibold`}
                  >
                    {TrackingService.getStatusIcon(tracking.status)}{" "}
                    {TrackingService.getStatusLabel(tracking.status)}
                  </Badge>
                  {isPolling && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      🔄 Monitorando
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Transportadora: {tracking.shippingCompany}
                {isPolling && (
                  <span className="ml-2 text-green-600 text-xs">
                    • Atualizações automáticas ativadas
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">
                    Status Atual:
                  </span>
                  <p className="text-gray-600 mt-1">
                    {TrackingService.getStatusLabel(tracking.status)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Transportadora:
                  </span>
                  <p className="text-gray-600 mt-1">
                    {tracking.shippingCompany}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Previsão de Entrega:
                  </span>
                  <p className="text-gray-600 mt-1">
                    {new Date(tracking.estimatedDelivery).toLocaleDateString(
                      "pt-BR",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          <TrackingTimeline tracking={tracking} />

          {/* Help Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                ℹ️ Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium mb-1">
                  📞 Contato da Transportadora:
                </p>
                <p>
                  Entre em contato com {tracking.shippingCompany} para
                  informações adicionais sobre a entrega.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">🕒 Atualizações:</p>
                <p>
                  As informações de rastreamento são atualizadas
                  automaticamente. Pode haver atraso de algumas horas entre o
                  evento real e a atualização no sistema.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">❓ Problemas na Entrega:</p>
                <p>
                  Se houver problemas com sua entrega, entre em contato conosco
                  através do suporte ao cliente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions when no search performed */}
      {!tracking && !loading && !error && !trackingCode && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Pronto para Rastrear?
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Digite seu código de rastreamento no campo acima para acompanhar sua
            encomenda em tempo real
          </p>

          <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-3">
              💡 Onde encontrar seu código?
            </h4>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>• E-mail de confirmação do pedido</li>
              <li>• Área "Meus Pedidos" no seu perfil</li>
              <li>• SMS de confirmação (se ativado)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
