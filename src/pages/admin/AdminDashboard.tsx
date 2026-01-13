import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminProductService } from "@/services/adminProductService";
import { OrderService } from "@/services/orderService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errorHandling";

export function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: {
      total: 0,
      categories: 0,
      lowStock: 0,
      outOfStock: 0,
      averagePrice: 0,
      mostPopularCategory: "",
    },
    orders: {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load product statistics
      const productStats = await AdminProductService.getProductStatistics();

      // Load order statistics
      const orderStats = await OrderService.getOrderStatistics();

      setStats({
        products: productStats,
        orders: orderStats,
      });
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao carregar dados: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const quickActions = [
    {
      title: "Novo Produto",
      description: "Adicionar um novo produto ao catálogo",
      icon: Package,
      href: "/admin/products",
      color: "bg-blue-500",
    },
    {
      title: "Gerenciar Pedidos",
      description: "Visualizar e gerenciar pedidos dos clientes",
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "bg-green-500",
    },
    {
      title: "Relatórios",
      description: "Visualizar relatórios e estatísticas",
      icon: BarChart3,
      href: "/admin/reports",
      color: "bg-purple-500",
    },
    {
      title: "Configurações",
      description: "Configurações do sistema e preferências",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600">
          Bem-vindo de volta, {user?.userName}! Aqui está um resumo da sua loja.
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.products.categories} categoria(s)
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orders.pending} pendente(s)
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.orders.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(stats.orders.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas de Estoque
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.products.lowStock + stats.products.outOfStock}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.products.outOfStock} sem estoque
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <Link to={action.href}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Produtos em estoque</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {stats.products.total - stats.products.outOfStock}
              </Badge>
            </div>

            {stats.products.lowStock > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estoque baixo</span>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800"
                >
                  {stats.products.lowStock}
                </Badge>
              </div>
            )}

            {stats.products.outOfStock > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sem estoque</span>
                <Badge variant="destructive">{stats.products.outOfStock}</Badge>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                Categoria mais popular:{" "}
                <span className="font-medium">
                  {stats.products.mostPopularCategory || "N/A"}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Preço médio:{" "}
                <span className="font-medium">
                  {formatCurrency(stats.products.averagePrice)}
                </span>
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/products">
                <Package className="h-4 w-4 mr-2" />
                Gerenciar Produtos
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pedidos entregues</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {stats.orders.completed}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pedidos pendentes</span>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                {stats.orders.pending}
              </Badge>
            </div>

            {stats.orders.cancelled > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Pedidos cancelados
                </span>
                <Badge variant="destructive">{stats.orders.cancelled}</Badge>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Taxa de conversão</p>
                  <p className="font-medium">
                    {stats.orders.total > 0
                      ? `${(
                          (stats.orders.completed / stats.orders.total) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Ticket médio</p>
                  <p className="font-medium">
                    {formatCurrency(stats.orders.averageOrderValue)}
                  </p>
                </div>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Gerenciar Pedidos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(stats.products.lowStock > 0 || stats.products.outOfStock > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.products.outOfStock > 0 && (
                <p className="text-sm text-orange-700">
                  • <strong>{stats.products.outOfStock}</strong> produto(s) sem
                  estoque
                </p>
              )}
              {stats.products.lowStock > 0 && (
                <p className="text-sm text-orange-700">
                  • <strong>{stats.products.lowStock}</strong> produto(s) com
                  estoque baixo
                </p>
              )}
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/admin/products?filter=low_stock">
                  Ver Produtos com Problema
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
