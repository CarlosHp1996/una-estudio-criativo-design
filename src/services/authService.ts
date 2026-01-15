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
    try {
      const response = await fetch(
        "https://localhost:4242/api/Auth/login", // Revert to working URL
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const authResponse: AuthResponse = {
        token: data.value?.token || data.token,
        user: data.value || data.user,
        success: true,
      };

      // Store token and user data
      if (authResponse.token) {
        tokenManager.setToken(authResponse.token);
        localStorage.setItem("una_user", JSON.stringify(authResponse.user));
      }

      return authResponse;
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed");
    }
  }

  // Register new account
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log("AuthService.register called with:", data);

      // Send data in correct format as per CreateUserRequest
      const requestData = {
        name: data.userName, // Required
        email: data.email, // Required
        password: data.password, // Required
        phoneNumber: null, // Optional - send null
        cpf: null, // Optional - send null
        gender: null, // Optional - send null
        addresses: null, // Optional - send null
      };

      console.log("Sending request data:", requestData);

      const response = await fetch(
        "https://localhost:4242/api/Auth/create", // Correct URL from curl
        {
          method: "POST",
          headers: {
            accept: "text/plain",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      console.log("Register response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Register error response:", errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Register response data:", responseData);

      // Map CreateUserResponse to User interface
      const backendUser = responseData.user; // UserDto from CreateUserResponse

      const user: User = {
        id: backendUser?.id || "",
        userName: backendUser?.userName || "User",
        email: backendUser?.email || "",
        roles: ["User"], // Default role since UserDto doesn't have roles
        profilePicture: backendUser?.profilePicture,
        createdAt: new Date().toISOString(), // UserDto doesn't have createdAt
        updatedAt: new Date().toISOString(), // UserDto doesn't have updatedAt
      };

      const authResponse: AuthResponse = {
        token: "", // Registration doesn't return token
        user: user,
        success: true,
      };

      // Don't store token for registration (only login provides token)
      // Just return user info for confirmation
      return authResponse;

      return authResponse;
    } catch (error: any) {
      console.error("Register error:", error);
      throw new Error(error.message || "Registration failed");
    }
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

  // Google login with access token
  static async googleLogin(accessToken: string): Promise<SocialAuthResponse> {
    const response = await apiUtils.post<SocialAuthResponse>(
      "/social-auth/google",
      { accessToken }
    );

    // Store token and user data
    if (response.jwtToken) {
      tokenManager.setToken(response.jwtToken);
      localStorage.setItem("una_user", JSON.stringify(response.user));
    }

    return response;
  }

  // Facebook login with access token
  static async facebookLogin(accessToken: string): Promise<SocialAuthResponse> {
    const response = await apiUtils.post<SocialAuthResponse>(
      "/social-auth/facebook",
      { accessToken }
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
    return await apiUtils.get<User>("/Auth/profile");
  }

  // Update user profile
  static async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiUtils.put<User>("/Auth/profile", data);

    // Update stored user data
    localStorage.setItem("una_user", JSON.stringify(response));

    return response;
  }

  // Change password
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiUtils.post<void>("/Auth/change-password", data);
  }

  // Logout (clear local storage and call logout endpoint)
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      const token = tokenManager.getToken();
      if (token) {
        await apiUtils.post<void>("/Auth/logout");
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
