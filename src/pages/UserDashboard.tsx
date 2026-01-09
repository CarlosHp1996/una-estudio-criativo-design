import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkeletonStats } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/apiClient";
import {
  ShoppingBag,
  Heart,
  CreditCard,
  Package,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export function UserDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular loading de dados do dashboard
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Dados mock - em um app real viriam da API
  const dashboardStats = {
    totalOrders: 12,
    pendingOrders: 2,
    totalSpent: 2450.5,
    favoriteItems: 8,
    recentOrders: [
      {
        id: "ORD-001",
        date: "2024-12-26",
        total: 189.9,
        status: "delivered",
        items: 3,
      },
      {
        id: "ORD-002",
        date: "2024-12-20",
        total: 350.0,
        status: "processing",
        items: 2,
      },
      {
        id: "ORD-003",
        date: "2024-12-15",
        total: 125.5,
        status: "delivered",
        items: 1,
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Entregue";
      case "processing":
        return "Processando";
      case "cancelled":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  return (
    <div className="p-6">
      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <SkeletonStats />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up">
          {/* Demo Mode Alert */}
          {apiClient.isDemoMode() && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <strong>🎯 Modo Demonstração:</strong> Você está usando dados
                fictícios para testar as funcionalidades. Todas as ações
                funcionam normalmente mas não são salvas permanentemente.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo, {user?.name || "Usuário"}!
            </h1>
            <p className="text-gray-600">
              Gerencie sua conta e acompanhe seus pedidos
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="hover-lift transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total de Pedidos
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.totalOrders}
                    </p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pedidos Pendentes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.pendingOrders}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Gasto
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      R${" "}
                      {dashboardStats.totalSpent.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Favoritos
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.favoriteItems}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Perfil */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>Seus dados pessoais</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/perfil">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{user?.email || "email@exemplo.com"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{user?.phone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{user?.address || "Endereço não informado"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <span>
                      Membro desde{" "}
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                        : "Dezembro 2024"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pedidos Recentes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pedidos Recentes</CardTitle>
                    <CardDescription>Seus últimos pedidos</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/pedidos">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.recentOrders.map((order, index) => (
                    <div key={order.id}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-sm">#{order.id}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.date).toLocaleDateString("pt-BR")} •{" "}
                            {order.items} {order.items === 1 ? "item" : "itens"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            R${" "}
                            {order.total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(order.status)}
                          >
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>
                      {index < dashboardStats.recentOrders.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  asChild
                >
                  <Link to="/dashboard/pedidos">
                    <ShoppingBag className="h-6 w-6" />
                    <span>Meus Pedidos</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  asChild
                >
                  <Link to="/dashboard/favoritos">
                    <Heart className="h-6 w-6" />
                    <span>Favoritos</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  asChild
                >
                  <Link to="/dashboard/pagamentos">
                    <CreditCard className="h-6 w-6" />
                    <span>Pagamentos</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 button-pulse transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  asChild
                >
                  <Link to="/dashboard/perfil">
                    <Edit className="h-6 w-6" />
                    <span>Editar Perfil</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
