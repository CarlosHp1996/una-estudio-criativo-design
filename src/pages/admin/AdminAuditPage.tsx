import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  Shield,
  Search,
  Filter,
  AlertTriangle,
  FileText,
  Clock,
  Activity,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  AuditService,
  type AuditLogEntry,
  type AuditStatisticsResponse,
  type PendingWebhook,
} from "@/services/auditService";
import { parseApiError } from "@/lib/errorHandling";

/**
 * AdminAuditPage — auditoria de PAGAMENTOS/webhooks com dados REAIS do backend
 * (AuditController). A auditoria hoje e focada em eventos de pagamento e retries
 * de webhook; NAO existe auditoria generica de acoes de admin (produto/pedido),
 * entao esses conceitos foram removidos da tela para nao exibir mock.
 */
export function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStatisticsResponse | null>(null);
  const [pendingWebhooks, setPendingWebhooks] = useState<PendingWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [periodDays, setPeriodDays] = useState<string>("30");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadAuditData = useCallback(async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - Number(periodDays) * 24 * 60 * 60 * 1000,
      );

      // Requisicoes reais em paralelo. Cada uma tolera falha individual para nao
      // derrubar a tela inteira (ex.: se webhooks/pending nao responder).
      const [statsResult, periodResult, webhooksResult] =
        await Promise.allSettled([
          AuditService.getStatistics(),
          AuditService.getLogsByPeriod(startDate, endDate),
          AuditService.getPendingWebhooks(),
        ]);

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        setStats(null);
      }

      if (periodResult.status === "fulfilled") {
        setLogs(periodResult.value.logs ?? []);
      } else {
        setLogs([]);
        const errorMessage = parseApiError(periodResult.reason).message;
        toast.error(`Erro ao carregar logs de auditoria: ${errorMessage}`);
      }

      if (webhooksResult.status === "fulfilled") {
        setPendingWebhooks(webhooksResult.value.webhooks ?? []);
      } else {
        setPendingWebhooks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  const handleRetryWebhook = async (webhookId: string) => {
    try {
      setRetryingId(webhookId);
      await AuditService.retryWebhook(webhookId);
      toast.success("Retry do webhook solicitado");
      loadAuditData();
    } catch (error: unknown) {
      console.error("Failed to retry webhook:", error);
      const errorMessage = parseApiError(error as AxiosError).message;
      toast.error(`Erro ao reprocessar webhook: ${errorMessage}`);
    } finally {
      setRetryingId(null);
    }
  };

  // Fontes disponiveis (para o filtro) derivadas dos logs carregados.
  const availableSources = Array.from(
    new Set(logs.map((l) => l.source).filter(Boolean)),
  );

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term.length === 0 ||
      log.eventType?.toLowerCase().includes(term) ||
      log.source?.toLowerCase().includes(term) ||
      log.paymentId?.toLowerCase().includes(term) ||
      log.userId?.toLowerCase().includes(term);

    const matchesSource =
      sourceFilter === "all" || log.source === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source?.toLowerCase()) {
      case "webhook":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Webhook
          </Badge>
        );
      case "api":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            API
          </Badge>
        );
      case "system":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Sistema
          </Badge>
        );
      default:
        return <Badge variant="outline">{source || "—"}</Badge>;
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString(
      "pt-BR",
    )}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Auditoria de Pagamentos
          </h1>
          <p className="text-gray-600">
            Eventos de pagamento e webhooks registrados pelo backend
          </p>
        </div>
        <Button onClick={loadAuditData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards (dados reais de /audit/statistics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos (7 dias)
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.totalLogsLast7Days : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Webhooks Pendentes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.webhooksPending : pendingWebhooks.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos no Período
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Última Atividade
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats?.lastActivity ? formatDateTime(stats.lastActivity) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por evento, origem, pagamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                {availableSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Webhooks (dados reais de /audit/webhooks/pending) */}
      {pendingWebhooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Webhooks Pendentes de Reprocessamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Próximo Retry</TableHead>
                  <TableHead>Último Erro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">
                      {webhook.eventType}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {webhook.paymentId
                        ? `#${webhook.paymentId.slice(-6)}`
                        : "—"}
                    </TableCell>
                    <TableCell>{webhook.attemptCount}</TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(webhook.nextRetryAt)}
                    </TableCell>
                    <TableCell className="text-sm text-red-600 max-w-xs truncate">
                      {webhook.lastErrorMessage || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryWebhook(webhook.id)}
                        disabled={retryingId === webhook.id}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${
                            retryingId === webhook.id ? "animate-spin" : ""
                          }`}
                        />
                        Reprocessar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Table (dados reais de /audit/period) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-600">
                          Nenhum evento de auditoria no período
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.eventType}
                      </TableCell>
                      <TableCell>{getSourceBadge(log.source)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.paymentId ? `#${log.paymentId.slice(-6)}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.userId ? `#${log.userId.slice(-6)}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
