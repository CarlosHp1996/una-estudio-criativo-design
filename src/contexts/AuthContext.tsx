import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SocialUser,
} from "@/types/api";
import AuthService from "@/services/authService";
import { useErrorHandler } from "@/lib/errorHandling";

// Auth Context Type
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  socialLogin: (
    provider: "google" | "facebook",
    socialUser: SocialUser,
  ) => Promise<void>;
  logout: () => Promise<void>;
  // Retorna a resposta crua do backend (envelope Result<UpdateUserResponse>) para que
  // o chamador possa ler dados atualizados — ex.: o Id de um endereco recem-criado.
  updateProfile: (data: UpdateProfileRequest) => Promise<any>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  redirectAfterLogin: (user: User) => void;
}

// Auth State Type
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User } }
  | { type: "AUTH_FAILURE"; payload: { error: string } }
  | { type: "AUTH_LOGOUT" }
  | { type: "UPDATE_USER"; payload: { user: User } }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: { loading: boolean } };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload.user,
        error: null,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload.loading,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { handleError } = useErrorHandler();

  // Load stored auth data on init
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: "SET_LOADING", payload: { loading: true } });

      try {
        // Check if user is authenticated and validate session
        if (AuthService.isAuthenticated()) {
          const user = AuthService.getCurrentUser();

          if (user) {
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user },
            });

            // Refresh user data immediately to get fresh profile from backend
            refreshUser();
          } else {
            AuthService.clearLocalData();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        AuthService.clearLocalData();
      } finally {
        dispatch({ type: "SET_LOADING", payload: { loading: false } });
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage events (for social login detection)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "una_user" && event.newValue) {
        // User data was updated (likely from social login)
        try {
          const user = JSON.parse(event.newValue);
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user },
          });
        } catch (error) {
          console.error("Error parsing user data from storage:", error);
        }
      } else if (event.key === "una_user" && event.newValue === null) {
        // User data was cleared
        dispatch({ type: "AUTH_LOGOUT" });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthService.login(credentials);

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.user },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      handleError(error);
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterRequest): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthService.register(userData);

      // Registration successful but user is NOT authenticated yet
      // User needs to login after registration
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      handleError(error);
      throw error;
    }
  };

  // Social login function
  const socialLogin = async (
    provider: "google" | "facebook",
    socialUser: SocialUser,
  ): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthService.socialLogin(provider, { socialUser });

      if (!response.user) {
        throw new Error("No user data received from social login");
      }

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.user },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Social login failed";
      console.error(`${provider} login failed:`, errorMessage);
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      handleError(error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Update profile function
  const updateProfile = async (data: UpdateProfileRequest): Promise<any> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      const response = await AuthService.updateProfile(data);

      if (response && response.hasSuccess && response.value?.user) {
        const updatedBackendUser = response.value.user;

        // Merge with current user to preserve roles and other session data
        const newUser = {
          ...state.user,
          id: updatedBackendUser.id || state.user?.id,
          userName: updatedBackendUser.userName || state.user?.userName,
          email: updatedBackendUser.email || state.user?.email,
          profilePicture:
            updatedBackendUser.profilePicture || state.user?.profilePicture,
          // Preserva os enderecos retornados pelo backend (com seus Ids). Sem isso,
          // um endereco recem-cadastrado sumiria do contexto ate o proximo refresh.
          addresses:
            updatedBackendUser.addresses ?? state.user?.addresses ?? [],
          // Use whatever the backend returns, but preserve state for things like roles
          roles: state.user?.roles || ["User"],
        } as User;

        dispatch({
          type: "UPDATE_USER",
          payload: { user: newUser },
        });

        // Save to localStorage
        localStorage.setItem("una_user", JSON.stringify(newUser));
      }

      // Retorna a resposta crua para o chamador (ex.: Checkout precisa do Id do
      // endereco recem-criado presente em response.value.user.addresses).
      return response;
    } catch (error) {
      // Don't call AUTH_FAILURE here as it clears the session
      console.error("Profile update error:", error);
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Change password function
  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthService.changePassword(data);
      dispatch({ type: "CLEAR_ERROR" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Password change failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Solicita e-mail de recuperação de senha
  const forgotPassword = async (email: string): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthService.forgotPassword(email);
      dispatch({ type: "CLEAR_ERROR" });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Falha ao enviar e-mail de recuperação";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Redefine a senha a partir do token de recuperação
  const resetPassword = async (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthService.resetPassword(data);
      dispatch({ type: "CLEAR_ERROR" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Falha ao redefinir a senha";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      handleError(error);
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.isAuthenticated) return;

    try {
      // Validate current session instead of fetching new data
      const isValid = await AuthService.validateSession();

      if (!isValid) {
        // Session is invalid, logout user
        await logout();
        return;
      }

      // Session is valid, get current user data from token/storage
      const currentUser = AuthService.getCurrentUser();

      if (currentUser && currentUser.id) {
        // Fetch fresh data from backend
        const freshUser = await AuthService.getProfile(currentUser.id);
        const finalUser = freshUser ? { ...currentUser, ...freshUser } : currentUser;

        dispatch({
          type: "UPDATE_USER",
          payload: { user: finalUser },
        });

        // Update localStorage with fresh data
        localStorage.setItem("una_user", JSON.stringify(finalUser));
      } else {
        // No valid user data found
        await logout();
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // If refresh fails, user might need to re-login
      await logout();
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Redirect after login based on user role
  const redirectAfterLogin = (user: User): void => {
    if (user.roles?.includes("Admin") || user.roles?.includes("admin")) {
      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);
    } else {
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  };

  // Context value
  const value: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    socialLogin,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshUser,
    clearError,
    redirectAfterLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
