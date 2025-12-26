import { createContext, useReducer, useEffect, ReactNode } from "react";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AuthContextType,
} from "@/types/auth";
import { AUTH_STORAGE_KEYS } from "@/types/auth";
import { AuthAPI } from "@/services/authAPI";
import { apiClient } from "@/lib/apiClient";

// Auth State Type
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: { error: string } }
  | { type: "AUTH_LOGOUT" }
  | { type: "UPDATE_USER"; payload: { user: User } }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: { loading: boolean } };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
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
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
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

  // Load stored auth data on init
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
        const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER);

        if (token && userData) {
          const user = JSON.parse(userData);

          // Set token in API client
          apiClient.setAuthToken(token);

          // Dispatch success action
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user, token },
          });

          // Verify token validity in background
          try {
            const updatedUser = await AuthAPI.refreshCurrentUser();
            dispatch({
              type: "UPDATE_USER",
              payload: { user: updatedUser },
            });
          } catch (error) {
            // Token invalid, logout
            clearAuthData();
            dispatch({ type: "AUTH_LOGOUT" });
          }
        }
      } catch (error) {
        console.error("Error loading stored auth data:", error);
        // Clear invalid stored data
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      }
    };

    loadStoredAuth();
  }, []);

  // Store auth data in localStorage
  const storeAuthData = (user: User, token: string) => {
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    apiClient.setAuthToken(token);
  };

  // Clear stored auth data
  const clearAuthData = () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_ME);
    apiClient.clearAuthToken();
  };

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthAPI.login(credentials);

      if (response.success && response.user && response.token) {
        // Store auth data
        storeAuthData(response.user, response.token);

        // Store remember me preference
        if (credentials.rememberMe) {
          localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, "true");
        }

        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: response.user, token: response.token },
        });
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterRequest): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthAPI.register(userData);

      if (response.success && response.user && response.token) {
        // Store auth data
        storeAuthData(response.user, response.token);

        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: response.user, token: response.token },
        });
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearAuthData();
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Update profile function
  const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      const updatedUser = await AuthAPI.updateProfile(data);

      // Update stored user data
      localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      dispatch({
        type: "UPDATE_USER",
        payload: { user: updatedUser },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Profile update failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Change password function
  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthAPI.changePassword(data);
      dispatch({ type: "CLEAR_ERROR" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Password change failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthAPI.forgotPassword(email);
      dispatch({ type: "CLEAR_ERROR" });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Password reset request failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Reset password function
  const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      await AuthAPI.resetPassword(data);
      dispatch({ type: "CLEAR_ERROR" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Password reset failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: { loading: false } });
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.isAuthenticated) return;

    try {
      const updatedUser = await AuthAPI.refreshCurrentUser();

      // Update stored user data
      localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      dispatch({
        type: "UPDATE_USER",
        payload: { user: updatedUser },
      });
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // If refresh fails, might need to logout
      logout();
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Context value
  const value: AuthContextType = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
