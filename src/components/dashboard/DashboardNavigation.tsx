import { NavLink, useLocation } from "react-router-dom";
import {
  User,
  Settings,
  ShoppingBag,
  Heart,
  CreditCard,
  Bell,
  Shield,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Visão geral da conta",
  },
  {
    title: "Perfil",
    href: "/dashboard/perfil",
    icon: User,
    description: "Informações pessoais",
  },
  {
    title: "Pedidos",
    href: "/dashboard/pedidos",
    icon: ShoppingBag,
    description: "Histórico de compras",
  },
  {
    title: "Favoritos",
    href: "/dashboard/favoritos",
    icon: Heart,
    description: "Produtos salvos",
  },
  {
    title: "Pagamentos",
    href: "/dashboard/pagamentos",
    icon: CreditCard,
    description: "Cartões e métodos",
  },
  {
    title: "Notificações",
    href: "/dashboard/notificacoes",
    icon: Bell,
    description: "Alertas e avisos",
  },
  {
    title: "Segurança",
    href: "/dashboard/seguranca",
    icon: Shield,
    description: "Senha e privacidade",
  },
  {
    title: "Configurações",
    href: "/dashboard/configuracoes",
    icon: Settings,
    description: "Preferências gerais",
  },
];

export function DashboardNavigation() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="space-y-1">
      {/* Header do usuário */}
      <div className="p-3 border-b border-gray-100 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.name || "Usuário"}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Links de navegação */}
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href === "/dashboard" && location.pathname === "/dashboard");

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors group",
                "hover:bg-gray-50 hover:text-green-700",
                isActive
                  ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                  : "text-gray-700"
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-4 w-4 transition-colors",
                  isActive
                    ? "text-green-600"
                    : "text-gray-400 group-hover:text-green-600"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-gray-500 hidden lg:block">
                  {item.description}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
