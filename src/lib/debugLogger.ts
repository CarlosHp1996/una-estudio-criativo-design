// Debug Utility for Development
class DebugLogger {
  // M-4: em produção o logger é NO-OP total, independentemente das flags VITE_DEBUG_*.
  // Nunca logamos corpo de auth/pagamento em builds de produção.
  private isProd = import.meta.env.PROD;
  private isDebugMode =
    !this.isProd && import.meta.env.VITE_DEBUG_MODE === "true";
  private debugAPI = !this.isProd && import.meta.env.VITE_DEBUG_API === "true";
  private debugAuth = !this.isProd && import.meta.env.VITE_DEBUG_AUTH === "true";
  private consoleLogs =
    !this.isProd && import.meta.env.VITE_CONSOLE_LOGS === "true";

  // General debug logging
  log(
    message: string,
    data?: any,
    category: "API" | "AUTH" | "GENERAL" = "GENERAL"
  ) {
    if (this.isProd) return; // early return em produção
    if (!this.isDebugMode) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `🐛 [DEBUG ${category}] ${timestamp}:`;

    if (this.consoleLogs) {
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  }

  // API debug logging
  apiRequest(method: string, url: string, data?: any) {
    if (!this.debugAPI) return;
    this.log(`📤 ${method.toUpperCase()} Request to: ${url}`, data, "API");
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    if (!this.debugAPI) return;
    const statusIcon = status >= 200 && status < 300 ? "✅" : "❌";
    this.log(
      `📥 ${statusIcon} ${method.toUpperCase()} Response (${status}): ${url}`,
      data,
      "API"
    );
  }

  apiError(method: string, url: string, error: any) {
    if (!this.debugAPI) return;
    this.log(`🚨 ${method.toUpperCase()} Error: ${url}`, error, "API");
  }

  // Auth debug logging
  authAction(action: string, data?: any) {
    if (!this.debugAuth) return;
    this.log(`🔐 Auth Action: ${action}`, data, "AUTH");
  }

  // Network status
  networkStatus(isOnline: boolean) {
    this.log(
      `📶 Network Status: ${isOnline ? "Online" : "Offline"}`,
      null,
      "API"
    );
  }

  // Performance monitoring
  performance(label: string, startTime?: number) {
    if (!this.isDebugMode) return;

    if (startTime) {
      const duration = performance.now() - startTime;
      this.log(`⏱️ Performance: ${label} took ${duration.toFixed(2)}ms`);
    } else {
      this.log(`⏱️ Performance: Starting ${label}`);
      return performance.now();
    }
  }

  // Component lifecycle
  component(
    componentName: string,
    action: "mount" | "unmount" | "update",
    data?: any
  ) {
    if (!this.isDebugMode) return;
    const actionIcon = {
      mount: "🟢",
      unmount: "🔴",
      update: "🟡",
    };
    this.log(
      `${actionIcon[action]} Component ${componentName} ${action}`,
      data
    );
  }

  // Error tracking
  error(error: Error, context?: string) {
    // Em produção não logamos no console (pode conter dados sensíveis). O envio para
    // um serviço de tracking (Sentry, etc.) deve ser feito de forma controlada.
    if (this.isProd) {
      // TODO: Send to error tracking service (Sentry, etc.)
      return;
    }

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("🚨 Application Error:", errorInfo);
  }
}

export const debugLogger = new DebugLogger();

// Helper function for measuring async operations
export async function withDebugTiming<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = debugLogger.performance(label);
  try {
    const result = await operation();
    debugLogger.performance(label, startTime);
    return result;
  } catch (error) {
    debugLogger.performance(label, startTime);
    debugLogger.error(error as Error, label);
    throw error;
  }
}

// Network status monitoring
export function initNetworkMonitoring() {
  if (typeof window !== "undefined") {
    debugLogger.networkStatus(navigator.onLine);

    window.addEventListener("online", () => debugLogger.networkStatus(true));
    window.addEventListener("offline", () => debugLogger.networkStatus(false));
  }
}

export default debugLogger;
