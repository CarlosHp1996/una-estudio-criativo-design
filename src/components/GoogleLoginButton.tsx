import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/lib/errorHandling";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface GoogleLoginButtonProps {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
  children = "Entrar com Google",
  disabled = false,
}) => {
  const { socialLogin, redirectAfterLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);

        if (!tokenResponse.access_token) {
          throw new Error("No access token received from Google");
        }

        // Get user info from Google API first
        const googleUserResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`,
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

        // Create SocialUser object
        const socialUser = {
          providerId: googleUserData.id,
          provider: "google",
          email: googleUserData.email,
          name: googleUserData.name,
          picture: googleUserData.picture || null,
        };

        // Use the AuthContext socialLogin method
        await socialLogin("google", socialUser);

        // Show success toast
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo(a), ${googleUserData.name}!`,
          variant: "default",
        });

        // Give time for context to update before redirecting
        setTimeout(() => {
          // Get updated user data from localStorage to check roles
          const userData = localStorage.getItem("una_user");
          if (userData) {
            const user = JSON.parse(userData);
            redirectAfterLogin(user);
          } else {
            // Fallback to home if no user data
            window.location.href = "/";
          }
        }, 200);
      } catch (error: any) {
        console.error("Erro no login com Google:", error);

        const errorMessage = parseApiError(error).message;
        toast({
          title: "Erro no login com Google",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Erro no OAuth do Google:", error);
      toast({
        title: "Erro de autenticação",
        description: "Não foi possível conectar com o Google. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full ${className}`}
      onClick={() => googleLogin()}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isLoading ? "Conectando..." : children}
    </Button>
  );
};

export default GoogleLoginButton;
