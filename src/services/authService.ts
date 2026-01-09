// Authentication Service - API Integration
import { httpClient, apiUtils, tokenManager } from "@/lib/httpClient";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SocialAuthRequest,
  SocialAuthResponse,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types/api";

export class AuthService {
  // Login with email/password
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiUtils.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Store token and user data
    if (response.token) {
      tokenManager.setToken(response.token);
      localStorage.setItem("una_user", JSON.stringify(response.user));
    }

    return response;
  }

  // Register new account
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiUtils.post<AuthResponse>("/auth/register", data);

    // Store token and user data
    if (response.token) {
      tokenManager.setToken(response.token);
      localStorage.setItem("una_user", JSON.stringify(response.user));
    }

    return response;
  }

  // Social login (Google/Facebook)
  static async socialLogin(
    provider: "google" | "facebook",
    socialData: SocialAuthRequest
  ): Promise<SocialAuthResponse> {
    const response = await apiUtils.post<SocialAuthResponse>(
      `/social-auth/${provider}`,
      socialData
    );

    // Store token and user data
    if (response.jwtToken) {
      tokenManager.setToken(response.jwtToken);
      localStorage.setItem("una_user", JSON.stringify(response.user));
    }

    return response;
  }

  // Get current user profile
  static async getProfile(): Promise<User> {
    return await apiUtils.get<User>("/auth/profile");
  }

  // Update user profile
  static async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiUtils.put<User>("/auth/profile", data);

    // Update stored user data
    localStorage.setItem("una_user", JSON.stringify(response));

    return response;
  }

  // Change password
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiUtils.post<void>("/auth/change-password", data);
  }

  // Logout (clear local storage and call logout endpoint)
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      const token = tokenManager.getToken();
      if (token) {
        await apiUtils.post<void>("/auth/logout");
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear local data
      AuthService.clearLocalData();
    }
  }

  // Clear all local authentication data
  static clearLocalData(): void {
    tokenManager.removeToken();
    localStorage.removeItem("una_user");
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = tokenManager.getToken();
    if (!token) return false;

    // Check if token is expired
    return !tokenManager.isTokenExpired(token);
  }

  // Get current user from local storage
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem("una_user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Refresh user data from API
  static async refreshUserData(): Promise<User | null> {
    try {
      if (!AuthService.isAuthenticated()) return null;

      const user = await AuthService.getProfile();
      localStorage.setItem("una_user", JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  }

  // Validate token and refresh user data if needed
  static async validateSession(): Promise<boolean> {
    try {
      if (!AuthService.isAuthenticated()) {
        AuthService.clearLocalData();
        return false;
      }

      // Try to fetch fresh user data to validate token
      await AuthService.refreshUserData();
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      AuthService.clearLocalData();
      return false;
    }
  }
}

export default AuthService;
