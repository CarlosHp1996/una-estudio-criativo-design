// Authentication Service - API Integration
import { apiUtils, tokenManager } from "@/lib/httpClient";
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
      // apiUtils já injeta baseURL e devolve o corpo da resposta (envelope Result<T>).
      const data = await apiUtils.post<any>("/Auth/login", credentials);

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
          profilePicture: tokenClaims.profilePicture || data.value?.profilePicture || null,
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

      const responseData = await apiUtils.post<any>("/Auth/create", requestData);
      const backendUser = responseData?.user;

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

  // Núcleo compartilhado do login social: chama o backend (/SocialAuth/{provider}),
  // extrai o token do envelope, decodifica o JWT, monta o usuário e persiste a sessão.
  // Reutilizado por socialLogin / googleLogin / facebookLogin — elimina a duplicação.
  private static async authenticateSocial(
    provider: "google" | "facebook",
    body: unknown,
  ): Promise<SocialAuthResponse> {
    // apiUtils injeta baseURL e devolve o corpo da resposta (SocialAuthResponse).
    const data = await apiUtils.post<any>(`/SocialAuth/${provider}`, body);

    // Extract token from SocialAuthResponse structure
    const token = data?.JwtToken || data?.jwtToken;

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
      profilePicture:
        tokenClaims.profilePicture || data.User?.profilePicture || null,
      createdAt: data.User?.createdAt || new Date().toISOString(),
      updatedAt: data.User?.updatedAt || new Date().toISOString(),
    };

    const socialAuthResponse: SocialAuthResponse = {
      jwtToken: token,
      user: user,
      success: true,
    };

    // Store token and user data
    tokenManager.setToken(token);
    localStorage.setItem("una_user", JSON.stringify(user));

    return socialAuthResponse;
  }

  // Social login (Google/Facebook) — NOVO CONTRATO (C-1): enviamos apenas o
  // `accessToken` (+ returnUrl opcional). O backend valida o token com o provedor
  // server-side, resolve o perfil e devolve o JWT+user. O client NÃO consulta mais
  // googleapis.com/graph.facebook.com nem monta objeto de perfil.
  static async socialLogin(
    provider: "google" | "facebook",
    socialData: SocialAuthRequest,
  ): Promise<SocialAuthResponse> {
    try {
      if (!socialData?.accessToken || socialData.accessToken.trim() === "") {
        throw new Error("Access token is empty or undefined");
      }
      return await AuthService.authenticateSocial(provider, socialData);
    } catch (error: any) {
      console.error(`${provider} login failed:`, error);
      throw new Error(error.message || `${provider} login failed`);
    }
  }

  // Google login with access token — apenas repassa o token ao backend.
  static async googleLogin(
    accessToken: string,
    returnUrl?: string | null,
  ): Promise<SocialAuthResponse> {
    return AuthService.socialLogin("google", { accessToken, returnUrl });
  }

  // Facebook login with access token — apenas repassa o token ao backend.
  static async facebookLogin(
    accessToken: string,
    returnUrl?: string | null,
  ): Promise<SocialAuthResponse> {
    return AuthService.socialLogin("facebook", { accessToken, returnUrl });
  }

  // Upload user avatar
  static async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiUtils.post<any>("/Auth/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  }

  // Update user profile
  static async updateProfile(data: any): Promise<any> {
    const response = await apiUtils.put<any>("/Auth/update", data);
    return response;
  }

  // Change password
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiUtils.post<void>("/Auth/change-password", data);
  }

  // Envia e-mail de recuperação de senha (backend espera o e-mail via query string)
  // TODO backend: aceitar email no corpo (POST body) em vez de query string.
  static async forgotPassword(email: string): Promise<void> {
    await apiUtils.post<void>(
      `/Auth/forgout-password?email=${encodeURIComponent(email)}`,
      {}
    );
  }

  // Redefine a senha usando o token recebido por e-mail (fluxo de recuperação).
  // O backend trata a atualização de senha via /Auth/update quando isPasswordRecovery = true.
  static async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiUtils.put<void>("/Auth/update", {
      password: data.newPassword,
      isPasswordRecovery: true,
      token: data.token,
    });
  }

  // Get fresh user profile data
  static async getProfile(id: string): Promise<User | null> {
    try {
      const response = await apiUtils.get<any>(`/Auth/get/${id}`);
      if (response && response.hasSuccess && response.value?.user) {
        return response.value.user as User;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
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

      // Always decode token to get roles and sub (id)
      const tokenClaims = tokenManager.decodeToken(token);
      if (!tokenClaims) return null;

      // Get stored user data which includes fresh profile info after updates
      const storedUser = this.getStoredUser();

      const user: User = {
        id: tokenClaims.sub || storedUser?.id || "",
        userName: storedUser?.userName || tokenClaims.name || "User",
        email: storedUser?.email || tokenClaims.email || "",
        roles: tokenClaims.roles || storedUser?.roles || ["User"],
        profilePicture: storedUser?.profilePicture || tokenClaims.profilePicture || null,
        phone: storedUser?.phone || undefined,
        cpf: storedUser?.cpf || undefined,
        gender: storedUser?.gender || 0,
        bio: storedUser?.bio || "",
        addresses: storedUser?.addresses || [],
        createdAt: storedUser?.createdAt || new Date().toISOString(),
        updatedAt: storedUser?.updatedAt || new Date().toISOString(),
      };

      return user;
    } catch (error) {
      console.error("Failed to get current user:", error);
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
        AuthService.clearLocalData();
        return false;
      }

      // Check if token is valid by trying to decode it
      const token = tokenManager.getToken();
      if (!token) {
        AuthService.clearLocalData();
        return false;
      }

      // Try to decode token to validate it's still valid
      const claims = tokenManager.decodeToken(token);
      if (!claims) {
        AuthService.clearLocalData();
        return false;
      }

      // Check if token is expired (if exp claim is present)
      if (claims.exp && claims.exp * 1000 < Date.now()) {
        AuthService.clearLocalData();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      AuthService.clearLocalData();
      return false;
    }
  }
}

export default AuthService;
