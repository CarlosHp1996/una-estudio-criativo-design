import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data.email);

      setIsSubmitted(true);

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      // Error is already handled by the AuthContext
      console.error("Forgot password error:", error);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues("email");
    if (email) {
      try {
        await forgotPassword(email);
        toast({
          title: "Email reenviado!",
          description: "Verificamos sua caixa de entrada novamente.",
        });
      } catch (error) {
        console.error("Resend email error:", error);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              UNA{" "}
              <span className="font-light text-green-600">
                Estudio Criativo
              </span>
            </h1>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Email enviado!</CardTitle>
              <CardDescription>
                Enviamos instruções para redefinir sua senha para{" "}
                <strong>{getValues("email")}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>
                  Verifique sua caixa de entrada e siga as instruções no email.
                </p>
                <p className="mt-2">O link é válido por 24 horas.</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">Não recebeu o email?</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Reenviar email"
                  )}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                <Link
                  to="/login"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar para login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            UNA{" "}
            <span className="font-light text-green-600">Estudio Criativo</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Esqueceu sua senha? Não se preocupe!
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>
              Digite seu email e enviaremos instruções para redefinir sua senha
            </CardDescription>
          </CardHeader>

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

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <p>
                  📧 Você receberá um email com um link para redefinir sua
                  senha.
                </p>
                <p className="mt-1">
                  🔒 Por segurança, o link expira em 24 horas.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar instruções
                  </>
                )}
              </Button>

              {/* Links */}
              <div className="flex flex-col space-y-2 text-center text-sm">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar para login
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
