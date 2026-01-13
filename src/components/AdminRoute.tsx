import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "./ui/alert";
import { ShieldX, Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component for protecting admin-only routes
 * Requires user to be authenticated AND have admin role
 */
export function AdminRoute({ children, fallback = null }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication status
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  const isAdmin =
    user?.roles?.includes("Admin") || user?.roles?.includes("admin");

  // If user is authenticated but not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
            <p className="mt-2 text-gray-600">
              Você não possui permissões administrativas para acessar esta área.
            </p>
          </div>

          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              Esta seção é restrita apenas para administradores do sistema.
              Entre em contato com um administrador se você acredita que deveria
              ter acesso.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>

            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has admin role, render the protected content
  return <>{children}</>;
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return (
    user?.roles?.includes("Admin") || user?.roles?.includes("admin") || false
  );
}

export default AdminRoute;
