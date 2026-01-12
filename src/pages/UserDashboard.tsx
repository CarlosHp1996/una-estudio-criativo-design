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
import { Spinner } from "@/components/ui/spinner";
import { OrderService } from "@/services/orderService";
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
import { Order } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";

export function UserDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load statistics
      const stats = await OrderService.getOrderStatistics();
      setStatistics(stats);

      // Load recent orders (first 3)
      const ordersResponse = await OrderService.getOrders(1, 3);
      setRecentOrders(ordersResponse.items);
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(errorMessage);
      
      // Set default values on error
      setStatistics({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      });
      setRecentOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "processing": return "bg-blue-500";
      case "shipped": return "bg-purple-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "Pendente";
      case "processing": return "Processando";
      case "shipped": return "Enviado";
      case "delivered": return "Entregue";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };
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
              Bem-vindo, {user?.userName || "Usuário"}!
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
                      {statistics?.totalOrders || 0}
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
                      {statistics?.pendingOrders || 0}
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
                      R$ {(statistics?.totalRevenue || 0).toLocaleString("pt-BR", {
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
                      Ticket Médio
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {(statistics?.averageOrderValue || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
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
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum pedido encontrado
                      </p>
                    </div>
                  ) : (
                    recentOrders.map((order, index) => (
                      <div key={order.id}>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-sm">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString("pt-BR")} •{" "}
                              {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              R$ {order.totalAmount.toLocaleString("pt-BR", {
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
                        {index < recentOrders.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))
                  )}
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
