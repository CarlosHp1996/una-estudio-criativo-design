import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/authService";
import { parseApiError } from "@/lib/errorHandling";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FacebookLoginButtonProps {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
  children = "Entrar com Facebook",
  disabled = false,
}) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);

      // TODO: Implement Facebook SDK when necessary
      // The keys are already configured: VITE_FACEBOOK_APP_ID=1551324589510448

      toast({
        title: "Em desenvolvimento",
        description:
          "Login com Facebook será implementado em breve. Chaves já configuradas!",
        variant: "default",
      });

      console.log(
        "Facebook App ID disponível:",
        import.meta.env.VITE_FACEBOOK_APP_ID
      );
    } catch (error: any) {
      console.error("Erro no login com Facebook:", error);

      const errorMessage = parseApiError(error).message;
      toast({
        title: "Erro no login com Facebook",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full ${className}`}
      onClick={handleFacebookLogin}
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
            fill="#1877F2"
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      )}
      {isLoading ? "Conectando..." : children}
    </Button>
  );
};

export default FacebookLoginButton;
