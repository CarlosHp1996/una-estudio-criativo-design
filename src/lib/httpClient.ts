// HTTP Client Configuration - Following React Frontend Best Practices
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { debugLogger } from "./debugLogger";

// Types for our API responses
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// Token management utilities
export const tokenManager = {
  getToken: (): string | null => {
    return (
      localStorage.getItem("una_token") || Cookies.get("una_token") || null
    );
  },

  setToken: (token: string): void => {
    localStorage.setItem("una_token", token);
    Cookies.set("una_token", token, { expires: 7 }); // 7 days
  },

  removeToken: (): void => {
    localStorage.removeItem("una_token");
    localStorage.removeItem("una_user");
    Cookies.remove("una_token");
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },
};

// Create axios instance with default configuration
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://localhost:4242/api",
    timeout: 15000, // 15 seconds timeout
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: false,
  });

  return client;
};

// Create the HTTP client instance
export const httpClient: AxiosInstance = createHttpClient();

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();

    // Debug logging (only in development)
    if (import.meta.env.VITE_DEBUG_API === "true") {
      debugLogger.apiRequest(
        config.method || "GET",
        config.url || "",
        config.data
      );
    }

    // List of endpoints that do NOT require a token.
    const publicEndpoints = [
      "/Auth/login",
      "/auth/login",
      "/auth/register",
      "/social-auth",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (token && !isPublicEndpoint) {
      // Check if token is expired
      if (tokenManager.isTokenExpired(token)) {
        tokenManager.removeToken();
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Token expired"));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token management
httpClient.interceptors.response.use(
  (response) => {
    // Log response time and details
    const metadata = (response.config as any).metadata;
    const duration = Date.now() - (metadata?.startTime || 0);
    debugLogger.apiResponse(
      response.config.method || "GET",
      response.config.url || "",
      response.status,
      { duration: `${duration}ms`, data: response.data }
    );

    return response;
  },
  (error: AxiosError) => {
    const { response, config } = error;

    // If it's a redirect, intercept and try again.
    if (response?.status === 307 || response?.status === 301) {
      const location = response.headers.location;
      if (location && import.meta.env.DEV) {
        // Converter HTTPS para HTTP e tentar novamente
        const httpLocation = location.replace("https://", "http://");
        debugLogger.apiError("REDIRECT_INTERCEPTED", location, {
          newUrl: httpLocation,
        });

        // Make a new request using HTTP.
        const newConfig = { ...config };
        newConfig.url = httpLocation;
        return httpClient.request(newConfig);
      }
    }

    // Debug log the error
    debugLogger.apiError(config?.method || "UNKNOWN", config?.url || "", {
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      message: error.message,
    });

    // Handle different error scenarios
    if (response) {
      const statusCode = response.status;

      switch (statusCode) {
        case 401:
          // Unauthorized - token expired or invalid
          tokenManager.removeToken();

          // Don't redirect if already on login/register pages
          const publicPages = [
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
          ];
          const currentPath = window.location.pathname;

          if (!publicPages.includes(currentPath)) {
            window.location.href = "/login";
          }
          break;

        case 403:
          // Forbidden - insufficient permissions
          console.error("Access forbidden:", response.data);
          break;

        case 404:
          // Not found
          console.error("Resource not found:", config?.url);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          console.error("Server error:", statusCode, response.data);
          break;
      }
    } else if (error.code === "ECONNABORTED") {
      // Timeout error
      console.error("Request timeout");
    } else if (error.message === "Network Error") {
      // Network error
      console.error("Network error - check if backend is running");
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API operations
export const apiUtils = {
  // Generic GET request with proper typing
  get: async <T>(url: string, config?: object): Promise<T> => {
    const response = await httpClient.get<T>(url, config);
    return response.data;
  },

  // Generic POST request with proper typing
  post: async <T, D = any>(
    url: string,
    data?: D,
    config?: object
  ): Promise<T> => {
    const response = await httpClient.post<T>(url, data, config);
    return response.data;
  },

  // Generic PUT request with proper typing
  put: async <T, D = any>(
    url: string,
    data?: D,
    config?: object
  ): Promise<T> => {
    const response = await httpClient.put<T>(url, data, config);
    return response.data;
  },

  // Generic DELETE request with proper typing
  delete: async <T>(url: string, config?: object): Promise<T> => {
    const response = await httpClient.delete<T>(url, config);
    return response.data;
  },

  // Upload file with progress callback
  upload: async <T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await httpClient.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // Health check endpoint
  healthCheck: async (): Promise<boolean> => {
    try {
      await httpClient.get("/health");
      return true;
    } catch {
      return false;
    }
  },
};

// Error response handler utility
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response?.data) {
    const errorData = error.response.data as any;
    return {
      message: errorData.message || "An error occurred",
      errors: errorData.errors || {},
      statusCode: error.response.status,
    };
  }

  return {
    message: error.message || "Network error occurred",
    statusCode: 0,
  };
};

// Default export
export default httpClient;
