// API base configuration for UNA Estudio Criativo backend
const API_BASE_URL = "https://localhost:4242/api";

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = this.getTokenFromStorage();
  }

  private getTokenFromStorage(): string | null {
    try {
      return localStorage.getItem("una_auth_token");
    } catch {
      return null;
    }
  }

  private setTokenInStorage(token: string): void {
    try {
      localStorage.setItem("una_auth_token", token);
      this.token = token;
    } catch (error) {
      console.error("Failed to store auth token:", error);
    }
  }

  private removeTokenFromStorage(): void {
    try {
      localStorage.removeItem("una_auth_token");
      this.token = null;
    } catch (error) {
      console.error("Failed to remove auth token:", error);
    }
  }

  setAuthToken(token: string): void {
    this.setTokenInStorage(token);
  }

  clearAuthToken(): void {
    this.removeTokenFromStorage();
  }

  getAuthToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Merge options safely so headers from options don't overwrite our defaults
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
      },
    };

    // Add auth token if available (preserve existing headers)
    if (this.token) {
      config.headers = {
        ...(config.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - token expired/invalid
      if (response.status === 401) {
        this.clearAuthToken();
        // Optionally redirect to login or dispatch logout event
        window.location.href = "/login";
        throw new Error("Authentication required");
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
      }

      // Return response data
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    const postOptions: RequestInit = {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    };

    return this.request<T>(endpoint, postOptions);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    const putOptions: RequestInit = {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    };

    return this.request<T>(endpoint, putOptions);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
