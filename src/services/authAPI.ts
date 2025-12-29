import { apiClient } from "@/lib/apiClient";
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  User,
  ApiResponse,
} from "@/types/auth";

export class AuthAPI {
  // POST /api/Auth/login
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Check for demo credentials first (for local testing)
      if (
        credentials.email === "demo@unaestudio.com" &&
        credentials.password === "demo123"
      ) {
        // Return mock successful response for demo
        const mockResponse: AuthResponse = {
          success: true,
          token: "demo_jwt_token_" + Date.now(),
          user: {
            id: "demo-user-123",
            name: "Maria Silva Demo",
            email: "demo@unaestudio.com",
            phone: "(11) 99999-9999",
            avatar: "",
            address: "Rua das Flores, 123",
            city: "São Paulo",
            state: "SP",
            zipCode: "01234-567",
            bio: "Usuária de demonstração da UNA Estudio Criativo. Apaixonada por moda e estilo!",
            role: "customer",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: new Date().toISOString(),
          },
          message: "Login realizado com sucesso!",
        };

        // Store token for demo
        apiClient.setAuthToken(mockResponse.token!);
        return mockResponse;
      }

      const response = await apiClient.post<AuthResponse>("/Auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      // Store token if login successful
      if (response.success && response.token) {
        apiClient.setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  }

  // POST /api/Auth/create
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/Auth/create", {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
      });

      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  }

  // POST /api/Auth/logout
  static async logout(): Promise<void> {
    try {
      await apiClient.post("/Auth/logout");
    } catch (error) {
      // Even if the API call fails, clear local token
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local auth token
      apiClient.clearAuthToken();
    }
  }

  // GET /api/Auth/get/{id}
  static async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        `/Auth/get/${userId}`
      );

      if (!response.success || !response.data) {
        throw new Error("Failed to fetch user data");
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch user"
      );
    }
  }

  // PUT /api/Auth/update
  static async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      // Check if using demo token
      const token = apiClient.getAuthToken();
      if (token && token.startsWith("demo_jwt_token_")) {
        // Return updated mock user for demo
        const mockUpdatedUser: User = {
          id: "demo-user-123",
          name: data.name || "Maria Silva Demo",
          email: data.email || "demo@unaestudio.com",
          phone: data.phone || "(11) 99999-9999",
          avatar: "",
          address: data.address || "Rua das Flores, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
          bio: "Usuária de demonstração da UNA Estudio Criativo. Perfil atualizado!",
          role: "customer",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: new Date().toISOString(),
        };

        return mockUpdatedUser;
      }

      const response = await apiClient.put<ApiResponse<User>>(
        "/Auth/update",
        data
      );

      if (!response.success || !response.data) {
        throw new Error("Failed to update profile");
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Profile update failed"
      );
    }
  }

  // POST /api/Auth/forgout-password?email={email}
  static async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/Auth/forgout-password?email=${encodeURIComponent(email)}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to send reset email");
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Password reset request failed"
      );
    }
  }

  // Reset password (assuming there's a reset endpoint)
  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      // Note: This endpoint might need to be confirmed with backend
      const response = await apiClient.post<ApiResponse>(
        "/Auth/reset-password",
        {
          token: data.token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Password reset failed");
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Password reset failed"
      );
    }
  }

  // Change password (for authenticated users)
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      // Check if using demo token
      const token = apiClient.getAuthToken();
      if (token && token.startsWith("demo_jwt_token_")) {
        // Simulate password change for demo (always successful)
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
        return;
      }

      const response = await apiClient.put<ApiResponse>("/Auth/update", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });

      if (!response.success) {
        throw new Error(response.message || "Password change failed");
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Password change failed"
      );
    }
  }

  // DELETE /api/Auth/delete/{id}
  static async deleteAccount(userId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/Auth/delete/${userId}`
      );

      if (!response.success) {
        throw new Error(response.message || "Account deletion failed");
      }

      // Clear auth token after successful deletion
      apiClient.clearAuthToken();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Account deletion failed"
      );
    }
  }

  // Refresh current user data
  static async refreshCurrentUser(): Promise<User> {
    try {
      // Get current user from token (assuming the token contains user ID)
      // This might need adjustment based on your backend implementation
      const response = await apiClient.get<ApiResponse<User>>("/Auth/get");

      if (!response.success || !response.data) {
        throw new Error("Failed to refresh user data");
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to refresh user data"
      );
    }
  }
}
