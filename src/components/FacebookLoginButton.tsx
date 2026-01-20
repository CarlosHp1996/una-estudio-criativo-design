import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/lib/errorHandling";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Declare Facebook types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

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
  const { socialLogin, redirectAfterLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [fbReady, setFbReady] = React.useState(false);

  useEffect(() => {
    // Initialize Facebook SDK
    const initializeFacebookSDK = () => {
      if (window.FB) {
        setFbReady(true);
        return;
      }

      // Load Facebook SDK
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v19.0",
        });
        setFbReady(true);
      };

      // Load SDK script
      if (!document.getElementById("facebook-jssdk")) {
        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/pt_BR/sdk.js";
        document.body.appendChild(script);
      }
    };

    initializeFacebookSDK();
  }, []);

  const handleFacebookLogin = async () => {
    if (!fbReady || !window.FB) {
      toast({
        title: "SDK não carregado",
        description: "Aguarde um momento e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Login with Facebook
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            console.log("Facebook login successful:", response);

            // Get user info
            window.FB.api(
              "/me",
              { fields: "id,name,email,picture" },
              async (userInfo: any) => {
                try {
                  console.log("Facebook user info:", userInfo);

                  // Create SocialUser object
                  const socialUser = {
                    providerId: userInfo.id,
                    provider: "facebook",
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture?.data?.url || null,
                  };

                  // Use the AuthContext socialLogin method
                  await socialLogin("facebook", socialUser);

                  toast({
                    title: "Login realizado com sucesso",
                    description: `Bem-vindo(a), ${userInfo.name}!`,
                    variant: "default",
                  });

                  // Give time for context to update before redirecting
                  setTimeout(() => {
                    // Get updated user data from localStorage to check roles
                    const userData = localStorage.getItem("una_user");
                    if (userData) {
                      const user = JSON.parse(userData);
                      console.log(
                        "FacebookLoginButton - Using context redirectAfterLogin for user:",
                        user,
                      );
                      redirectAfterLogin(user);
                    } else {
                      // Fallback to home if no user data
                      console.log(
                        "FacebookLoginButton - No user data found, redirecting to home...",
                      );
                      window.location.href = "/";
                    }
                  }, 200);
                } catch (error: any) {
                  console.error(
                    "Erro no processamento do login Facebook:",
                    error,
                  );
                  const errorMessage = parseApiError(error).message;
                  toast({
                    title: "Erro no login com Facebook",
                    description: errorMessage,
                    variant: "destructive",
                  });
                }
              },
            );
          } else {
            console.log("Facebook login cancelled.");
            toast({
              title: "Login cancelado",
              description: "O login com Facebook foi cancelado.",
              variant: "default",
            });
          }
          setIsLoading(false);
        },
        { scope: "email" },
      );
    } catch (error: any) {
      console.error("Erro no login com Facebook:", error);
      const errorMessage = parseApiError(error).message;
      toast({
        title: "Erro no login com Facebook",
        description: errorMessage,
        variant: "destructive",
      });
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
      disabled={disabled || isLoading || !fbReady}
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
