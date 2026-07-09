import { httpClient } from "../lib/httpClient";

/**
 * AuditService — bate nas rotas REAIS do AuditController (backend .NET).
 *
 * IMPORTANTE sobre o envelope: diferente do resto da API (que usa Result<T> e
 * exige `response.data.value`), o AuditController retorna objetos anonimos
 * DIRETAMENTE no corpo (ex.: `Ok(new { totalLogs, logs })`). Portanto aqui lemos
 * `response.data` (SEM `.value`).
 *
 * Rotas (prefixo /audit; requer autenticacao — [Authorize]):
 *   GET  /audit/statistics                 -> KPIs dos ultimos 7 dias
 *   GET  /audit/period?startDate=&endDate= -> logs por periodo (max 31 dias)
 *   GET  /audit/payment/{paymentId}        -> logs de um pagamento
 *   GET  /audit/webhooks/pending           -> webhooks pendentes de retry
 *   POST /audit/webhooks/{id}/retry        -> força retry de um webhook
 *
 * NAO existe no backend: auditoria generica de acoes de admin (produto/pedido),
 * paginacao de logs ou exportacao. A auditoria hoje e focada em PAGAMENTOS/webhooks.
 */

// Log de auditoria (payload de /audit/period).
export interface AuditLogEntry {
  id: string;
  paymentId?: string;
  eventType: string;
  source: string;
  createdAt: string;
  userId?: string;
  ipAddress?: string;
  additionalInfo?: string;
}

export interface AuditPeriodResponse {
  startDate: string;
  endDate: string;
  totalLogs: number;
  logs: AuditLogEntry[];
}

export interface AuditStatisticsResponse {
  period: { startDate: string; endDate: string };
  totalLogsLast7Days: number;
  logsByEventType: Record<string, number>;
  logsBySource: Record<string, number>;
  webhooksPending: number;
  lastActivity: string | null;
}

export interface PendingWebhook {
  id: string;
  paymentId?: string;
  webhookEventId?: string;
  eventType: string;
  attemptCount: number;
  firstAttemptAt?: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastErrorMessage?: string;
  isProcessed: boolean;
}

export interface PendingWebhooksResponse {
  totalPending: number;
  webhooks: PendingWebhook[];
}

export class AuditService {
  private static readonly BASE_PATH = "/audit";

  /** KPIs de auditoria dos ultimos 7 dias. Rota real: GET /audit/statistics. */
  static async getStatistics(): Promise<AuditStatisticsResponse> {
    const response = await httpClient.get<AuditStatisticsResponse>(
      `${this.BASE_PATH}/statistics`
    );
    return response.data;
  }

  /**
   * Logs de auditoria num periodo. Rota real: GET /audit/period.
   * O backend limita o intervalo a 31 dias e exige endDate >= startDate.
   */
  static async getLogsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<AuditPeriodResponse> {
    const params = new URLSearchParams();
    params.append("startDate", startDate.toISOString());
    params.append("endDate", endDate.toISOString());

    const response = await httpClient.get<AuditPeriodResponse>(
      `${this.BASE_PATH}/period?${params.toString()}`
    );
    return response.data;
  }

  /** Webhooks pendentes de reprocessamento. Rota real: GET /audit/webhooks/pending. */
  static async getPendingWebhooks(): Promise<PendingWebhooksResponse> {
    const response = await httpClient.get<PendingWebhooksResponse>(
      `${this.BASE_PATH}/webhooks/pending`
    );
    return response.data;
  }

  /** Força o retry de um webhook. Rota real: POST /audit/webhooks/{id}/retry. */
  static async retryWebhook(webhookRetryLogId: string): Promise<unknown> {
    const response = await httpClient.post<unknown>(
      `${this.BASE_PATH}/webhooks/${webhookRetryLogId}/retry`
    );
    return response.data;
  }
}
