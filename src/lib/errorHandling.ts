// Error utilities and standardized error handling
import { AxiosError } from "axios";
import { toast } from "sonner";

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  userFriendly: boolean;
}

// Error message mappings for user-friendly messages
export const errorMessages = {
  // Network errors
  NETWORK_ERROR: "Erro de conexão. Verifique sua internet e tente novamente.",
  TIMEOUT_ERROR: "A requisição demorou muito para responder. Tente novamente.",

  // Authentication errors
  INVALID_CREDENTIALS: "Email ou senha incorretos.",
  TOKEN_EXPIRED: "Sua sessão expirou. Faça login novamente.",
  UNAUTHORIZED: "Você não tem permissão para acessar este recurso.",

  // Validation errors
  VALIDATION_ERROR:
    "Alguns campos estão incorretos. Verifique e tente novamente.",
  EMAIL_ALREADY_EXISTS: "Este email já está cadastrado.",
  WEAK_PASSWORD: "A senha deve ter pelo menos 6 caracteres.",

  // Server errors
  INTERNAL_SERVER_ERROR:
    "Erro interno do servidor. Tente novamente mais tarde.",
  SERVICE_UNAVAILABLE: "Serviço temporariamente indisponível.",

  // Business logic errors
  INSUFFICIENT_STOCK: "Produto sem estoque suficiente.",
  INVALID_PAYMENT: "Dados de pagamento inválidos.",
  ORDER_NOT_FOUND: "Pedido não encontrado.",

  // Default
  UNKNOWN_ERROR: "Ocorreu um erro inesperado. Tente novamente.",
} as const;

// HTTP status code to error code mapping
const statusCodeToErrorCode = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "TIMEOUT_ERROR",
  409: "CONFLICT",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
  500: "INTERNAL_SERVER_ERROR",
  502: "SERVICE_UNAVAILABLE",
  503: "SERVICE_UNAVAILABLE",
  504: "TIMEOUT_ERROR",
} as const;

// Parse API error response
export function parseApiError(error: AxiosError): AppError {
  // Network error
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return {
        message: errorMessages.TIMEOUT_ERROR,
        code: "TIMEOUT_ERROR",
        userFriendly: true,
      };
    }

    return {
      message: errorMessages.NETWORK_ERROR,
      code: "NETWORK_ERROR",
      userFriendly: true,
    };
  }

  const { status, data } = error.response;
  const statusCode = status;

  // Try to get error message from API response
  let message = errorMessages.UNKNOWN_ERROR;
  let details: Record<string, any> = {};

  if (data && typeof data === "object") {
    // Standard API error response
    if (data.message) {
      message = data.message;
    }

    // Validation errors
    if (data.errors) {
      details = data.errors;
      message = errorMessages.VALIDATION_ERROR;
    }
  }

  // Map specific error messages
  if (data?.message) {
    const apiMessage = data.message.toLowerCase();

    if (apiMessage.includes("email") && apiMessage.includes("exists")) {
      message = errorMessages.EMAIL_ALREADY_EXISTS;
    } else if (
      apiMessage.includes("invalid") &&
      apiMessage.includes("credential")
    ) {
      message = errorMessages.INVALID_CREDENTIALS;
    } else if (apiMessage.includes("password") && apiMessage.includes("weak")) {
      message = errorMessages.WEAK_PASSWORD;
    } else if (apiMessage.includes("stock")) {
      message = errorMessages.INSUFFICIENT_STOCK;
    } else if (apiMessage.includes("payment")) {
      message = errorMessages.INVALID_PAYMENT;
    }
  }

  // Fallback to status code mapping
  const errorCode =
    statusCodeToErrorCode[statusCode as keyof typeof statusCodeToErrorCode];
  if (errorCode && !data?.message) {
    message = errorMessages[errorCode];
  }

  return {
    message,
    code: errorCode,
    statusCode,
    details,
    userFriendly: true,
  };
}

// Error notification utilities
export const errorNotifications = {
  // Show error toast
  show: (error: AppError | string) => {
    const message = typeof error === "string" ? error : error.message;
    toast.error(message);
  },

  // Show validation errors
  showValidation: (errors: Record<string, string[]>) => {
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach((message) => {
        toast.error(`${field}: ${message}`);
      });
    });
  },

  // Show success message
  success: (message: string) => {
    toast.success(message);
  },

  // Show info message
  info: (message: string) => {
    toast.info(message);
  },
};

// Hook for handling errors in components
export function useErrorHandler() {
  const handleError = (error: unknown) => {
    console.error("Error:", error);

    if (error instanceof AxiosError) {
      const appError = parseApiError(error);
      errorNotifications.show(appError);

      // Show validation errors separately
      if (appError.details && Object.keys(appError.details).length > 0) {
        errorNotifications.showValidation(appError.details);
      }
    } else if (error instanceof Error) {
      errorNotifications.show(error.message);
    } else {
      errorNotifications.show(errorMessages.UNKNOWN_ERROR);
    }
  };

  return { handleError };
}

// Async error wrapper for try/catch patterns
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  onError?: (error: AppError) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const appError =
      error instanceof AxiosError
        ? parseApiError(error)
        : {
            message:
              error instanceof Error
                ? error.message
                : errorMessages.UNKNOWN_ERROR,
            userFriendly: false,
          };

    if (onError) {
      onError(appError);
    } else {
      errorNotifications.show(appError);
    }

    return null;
  }
}

// Form validation error helpers
export function getFormErrorMessage(
  errors: Record<string, string[]> | undefined,
  fieldName: string
): string | undefined {
  return errors?.[fieldName]?.[0];
}

export function hasFormError(
  errors: Record<string, string[]> | undefined,
  fieldName: string
): boolean {
  return Boolean(errors?.[fieldName]?.length);
}
