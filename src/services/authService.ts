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
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const token = data.value?.token;
      if (!token) {
        throw new Error("No token received from login");
      }

      // Decode JWT token to extract user claims and roles
      const tokenClaims = tokenManager.decodeToken(token);

      if (!tokenClaims) {
        throw new Error("Failed to decode authentication token");
      }

      const authResponse: AuthResponse = {
        token: token,
        user: {
          id: tokenClaims.sub || data.value?.id || "",
          userName: tokenClaims.name || data.value?.name || "User",
          email: tokenClaims.email || "",
          roles: tokenClaims.roles || ["User"],
          profilePicture: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        success: data.hasSuccess || true,
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
      // Send data in correct format as per CreateUserRequest
      const requestData = {
        name: data.userName,
        email: data.email,
        password: data.password,
        phoneNumber: null,
        cpf: null,
        gender: null,
        addresses: null,
      };

      const response = await fetch("https://localhost:4242/api/Auth/create", {
        method: "POST",
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Register error:", errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const backendUser = responseData.user;

      const user: User = {
        id: backendUser?.id || "",
        userName: backendUser?.userName || "User",
        email: backendUser?.email || "",
        roles: ["User"],
        profilePicture: backendUser?.profilePicture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        token: "",
        user: user,
        success: true,
      };
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw new Error(error.message || "Registration failed");
    }
  }

  // Social login (Google/Facebook)
  static async socialLogin(
    provider: "google" | "facebook",
    socialData: SocialAuthRequest,
  ): Promise<SocialAuthResponse> {
    try {
      const response = await fetch(
        `https://localhost:4242/api/SocialAuth/${provider}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(socialData),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`${provider} login error:`, errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract token from SocialAuthResponse structure
      const token = data.JwtToken || data.jwtToken;

      if (!token) {
        console.error(`${provider} login - No token in response:`, data);
        throw new Error("No token received from social login");
      }

      // Decode JWT token to extract user claims and roles
      const tokenClaims = tokenManager.decodeToken(token);

      if (!tokenClaims) {
        throw new Error(
          "Failed to decode authentication token from social login",
        );
      }

      // Create user object from JWT claims combined with backend User data
      const user = {
        id: tokenClaims.sub || data.User?.id || "",
        userName: tokenClaims.name || data.User?.userName || "User",
        email: tokenClaims.email || data.User?.email || "",
        roles: tokenClaims.roles || ["User"],
        profilePicture: data.User?.profilePicture || null,
        createdAt: data.User?.createdAt || new Date().toISOString(),
        updatedAt: data.User?.updatedAt || new Date().toISOString(),
      };

      const socialAuthResponse: SocialAuthResponse = {
        jwtToken: token,
        user: user,
        success: true,
      };

      // Store token and user data
      if (socialAuthResponse.jwtToken) {
        tokenManager.setToken(socialAuthResponse.jwtToken);
        localStorage.setItem(
          "una_user",
          JSON.stringify(socialAuthResponse.user),
        );
      }

      return socialAuthResponse;
    } catch (error: any) {
      console.error(`${provider} login failed:`, error);
      throw new Error(error.message || `${provider} login failed`);
    }
  }

  // Google login with access token
  static async googleLogin(accessToken: string): Promise<SocialAuthResponse> {
    try {
      if (!accessToken || accessToken.trim() === "") {
        throw new Error("Access token is empty or undefined");
      }

      // Get user info from Google API
      const googleUserResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!googleUserResponse.ok) {
        throw new Error(
          `Failed to fetch Google user info: ${googleUserResponse.status}`,
        );
      }

      const googleUserData = await googleUserResponse.json();

      // Structure data as expected by backend
      const requestData = {
        socialUser: {
          providerId: googleUserData.id,
          provider: "google",
          email: googleUserData.email,
          name: googleUserData.name,
          picture: googleUserData.picture || null,
        },
        returnUrl: null,
      };

      // Send to backend
      const response = await fetch(
        "https://localhost:4242/api/SocialAuth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Google login error:", errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract token from SocialAuthResponse structure
      const token = data.JwtToken || data.jwtToken;

      if (!token) {
        console.error("Google login - No token in response:", data);
        throw new Error("No token received from Google login");
      }

      // Decode JWT token to extract user claims and roles
      const tokenClaims = tokenManager.decodeToken(token);

      if (!tokenClaims) {
        throw new Error(
          "Failed to decode authentication token from Google login",
        );
      }

      // Create user object from JWT claims combined with backend User data
      const user = {
        id: tokenClaims.sub || data.User?.id || "",
        userName: tokenClaims.name || data.User?.userName || "User",
        email: tokenClaims.email || data.User?.email || "",
        roles: tokenClaims.roles || ["User"],
        profilePicture: data.User?.profilePicture || null,
        createdAt: data.User?.createdAt || new Date().toISOString(),
        updatedAt: data.User?.updatedAt || new Date().toISOString(),
      };

      const socialAuthResponse: SocialAuthResponse = {
        jwtToken: token,
        user: user,
        success: true,
      };

      // Store token and user data
      if (socialAuthResponse.jwtToken) {
        tokenManager.setToken(socialAuthResponse.jwtToken);
        localStorage.setItem(
          "una_user",
          JSON.stringify(socialAuthResponse.user),
        );
      }

      return socialAuthResponse;
    } catch (error: any) {
      console.error("Google login failed:", error);
      throw new Error(error.message || "Google login failed");
    }
  }

  // Facebook login with access token
  static async facebookLogin(accessToken: string): Promise<SocialAuthResponse> {
    try {
      if (!accessToken || accessToken.trim() === "") {
        throw new Error("Access token is empty or undefined");
      }

      // Get user info from Facebook API
      const facebookUserResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!facebookUserResponse.ok) {
        throw new Error(
          `Failed to fetch Facebook user info: ${facebookUserResponse.status}`,
        );
      }

      const facebookUserData = await facebookUserResponse.json();

      // Structure data as expected by backend
      const requestData = {
        socialUser: {
          providerId: facebookUserData.id,
          provider: "facebook",
          email: facebookUserData.email,
          name: facebookUserData.name,
          picture: facebookUserData.picture?.data?.url || null,
        },
        returnUrl: null,
      };

      // Send to backend
      const response = await fetch(
        "https://localhost:4242/api/SocialAuth/facebook",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Facebook login error:", errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract token from SocialAuthResponse structure
      const token = data.JwtToken || data.jwtToken;

      if (!token) {
        console.error("Facebook login - No token in response:", data);
        throw new Error("No token received from Facebook login");
      }

      // Decode JWT token to extract user claims and roles
      const tokenClaims = tokenManager.decodeToken(token);

      if (!tokenClaims) {
        throw new Error(
          "Failed to decode authentication token from Facebook login",
        );
      }

      // Create user object from JWT claims combined with backend User data
      const user = {
        id: tokenClaims.sub || data.User?.id || "",
        userName: tokenClaims.name || data.User?.userName || "User",
        email: tokenClaims.email || data.User?.email || "",
        roles: tokenClaims.roles || ["User"],
        profilePicture: data.User?.profilePicture || null,
        createdAt: data.User?.createdAt || new Date().toISOString(),
        updatedAt: data.User?.updatedAt || new Date().toISOString(),
      };

      const socialAuthResponse: SocialAuthResponse = {
        jwtToken: token,
        user: user,
        success: true,
      };

      // Store token and user data
      if (socialAuthResponse.jwtToken) {
        tokenManager.setToken(socialAuthResponse.jwtToken);
        localStorage.setItem(
          "una_user",
          JSON.stringify(socialAuthResponse.user),
        );
      }

      return socialAuthResponse;
    } catch (error: any) {
      console.error("Facebook login failed:", error);
      throw new Error(error.message || "Facebook login failed");
    }
  }

  // Update user profile (if endpoint exists)
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
        await apiUtils.post<void>(
          "/Auth/logout",
          { token },
          {
            headers: {
              Accept: "text/plain",
            },
          },
        );
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

  // Get current user from JWT token (always fresh data)
  static getCurrentUser(): User | null {
    try {
      const token = tokenManager.getToken();
      if (!token) return null;

      // Always decode token to get fresh user data and roles
      const tokenClaims = tokenManager.decodeToken(token);
      if (!tokenClaims) return null;

      const user: User = {
        id: tokenClaims.sub || "",
        userName: tokenClaims.name || "User",
        email: tokenClaims.email || "",
        roles: tokenClaims.roles || ["User"],
        profilePicture: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("getCurrentUser - decoded user from token:", user);
      return user;
    } catch (error) {
      console.error("Failed to get current user from token:", error);
      return null;
    }
  }

  // Get stored user data (no API call needed)
  static getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem("una_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to get stored user data:", error);
      return null;
    }
  }

  // Validate token and refresh user data if needed
  static async validateSession(): Promise<boolean> {
    try {
      if (!AuthService.isAuthenticated()) {
        console.log("validateSession - User not authenticated");
        AuthService.clearLocalData();
        return false;
      }

      // Check if token is valid by trying to decode it
      const token = tokenManager.getToken();
      if (!token) {
        console.log("validateSession - No token found");
        AuthService.clearLocalData();
        return false;
      }

      // Try to decode token to validate it's still valid
      const claims = tokenManager.decodeToken(token);
      if (!claims) {
        console.log("validateSession - Token decode failed");
        AuthService.clearLocalData();
        return false;
      }

      // Check if token is expired (if exp claim is present)
      if (claims.exp && claims.exp * 1000 < Date.now()) {
        console.log("validateSession - Token expired");
        AuthService.clearLocalData();
        return false;
      }

      console.log("validateSession - Session is valid");
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      AuthService.clearLocalData();
      return false;
    }
  }
}

export default AuthService;
