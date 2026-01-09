import { createContext, useReducer, useEffect, ReactNode } from "react";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SocialAuthRequest,
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
    socialUser: SocialUser
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
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

            // Validate session in background and refresh user data
            AuthService.validateSession().then((isValid) => {
              if (!isValid) {
                dispatch({ type: "AUTH_LOGOUT" });
              } else {
                // Refresh user data
                AuthService.refreshUserData().then((updatedUser) => {
                  if (updatedUser) {
                    dispatch({
                      type: "UPDATE_USER",
                      payload: { user: updatedUser },
                    });
                  }
                });
              }
            });
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

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.user },
      });
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
    socialUser: SocialUser
  ): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthService.socialLogin(provider, { socialUser });

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.user },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Social login failed";
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
  const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: { loading: true } });

    try {
      const updatedUser = await AuthService.updateProfile(data);

      dispatch({
        type: "UPDATE_USER",
        payload: { user: updatedUser },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Profile update failed";
      dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
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

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.isAuthenticated) return;

    try {
      const updatedUser = await AuthService.refreshUserData();

      if (updatedUser) {
        dispatch({
          type: "UPDATE_USER",
          payload: { user: updatedUser },
        });
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
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
