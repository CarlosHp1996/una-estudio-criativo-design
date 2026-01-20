import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import FacebookLoginButton from "@/components/FacebookLoginButton";

// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    isLoading,
    error,
    isAuthenticated,
    clearError,
    redirectAfterLogin,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from state or default to home
  const from = location.state?.from?.pathname || "/";

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log(
        "Login.tsx - User is already authenticated, using role-based redirection",
      );
      redirectAfterLogin(user);
    }
  }, [isAuthenticated, user, redirectAfterLogin]);

  // Clear error when component unmounts or when user starts typing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      // Role-based redirection will be handled by the useEffect above
      // since login success updates isAuthenticated and user
    } catch (error) {
      // Error is already handled by the AuthContext and error handling utilities
      console.error("Login error:", error);
    }
  };

  const handleDemoLogin = () => {
    setValue("email", "admin@una.com");
    setValue("password", "Admin123!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            UNA{" "}
            <span className="font-light text-green-600">Estudio Criativo</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para continuar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>

          {/* Demo Banner */}
          <div className="mx-6 mb-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <strong>🎯 Demonstração:</strong> Use{" "}
                <code className="bg-green-100 px-1 rounded">
                  demo@unaestudio.com
                </code>{" "}
                e <code className="bg-green-100 px-1 rounded">demo123</code>{" "}
                para testar todas as funcionalidades!
              </AlertDescription>
            </Alert>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    {...register("password")}
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Demo Login Helper */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleDemoLogin}
                  className="text-xs text-gray-500"
                >
                  Usar credenciais de demonstração
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Login Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              {/* Social Login Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid gap-2">
                <GoogleLoginButton disabled={isLoading} className="w-full" />
                <FacebookLoginButton disabled={isLoading} className="w-full" />
              </div>

              {/* Links */}
              <div className="flex flex-col space-y-2 text-center text-sm">
                <Link
                  to="/esqueci-senha"
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  Esqueci minha senha
                </Link>

                <div className="flex items-center justify-center space-x-1">
                  <span className="text-gray-600">Não tem uma conta?</span>
                  <Link
                    to="/registro"
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Criar conta
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
