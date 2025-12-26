import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { AuthContextType } from "@/types/auth";

// Main auth hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Additional auth utility hooks

// Hook to check if user has specific role/permission
export function useAuthRole() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === "admin",
    isModerator: user?.role === "moderator" || user?.role === "admin",
    isUser: !!user,
    role: user?.role || null,
  };
}

// Hook for auth state checks
export function useAuthState() {
  const { isAuthenticated, isLoading, error } = useAuth();

  return {
    isLoggedIn: isAuthenticated,
    isLoggingIn: isLoading,
    hasAuthError: !!error,
    authError: error,
  };
}

// Hook for protected route logic
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    shouldRedirect: !isAuthenticated && !isLoading,
    isChecking: isLoading,
    isAuthorized: isAuthenticated,
  };
}

// Hook for form validation states
export function useAuthFormState() {
  const { isLoading, error, clearError } = useAuth();

  return {
    isSubmitting: isLoading,
    submitError: error,
    clearSubmitError: clearError,
  };
}
