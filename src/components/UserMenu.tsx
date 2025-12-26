import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  Package,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const UserMenu = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isAuthenticated && user ? (
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-green-100 text-green-700">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="relative">
            <User className="h-5 w-5" />
            <span className="sr-only">Menu do usuário</span>
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {isAuthenticated && user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/meus-pedidos" className="cursor-pointer">
                <Package className="mr-2 h-4 w-4" />
                Meus Pedidos
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/favoritos" className="cursor-pointer">
                <Heart className="mr-2 h-4 w-4" />
                Favoritos
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/configuracoes" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da Conta
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to="/login" className="cursor-pointer">
                <LogIn className="mr-2 h-4 w-4" />
                Fazer Login
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/registro" className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Conta
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
