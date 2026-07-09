import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
} from "lucide-react";
import { AdminOrderService } from "@/services/adminOrderService";
import { AdminProductService } from "@/services/adminProductService";
import { Spinner } from "@/components/ui/spinner";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalCustomers: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportType, setReportType] = useState<string>("overview");

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on selected period
      const now = new Date();
      let start: Date;

      switch (selectedPeriod) {
        case "week":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case "custom":
          if (startDate && endDate) {
            start = new Date(startDate);
            now.setTime(new Date(endDate).getTime());
          } else {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
          }
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Estatisticas REAIS: GET /orders/statistics (nao filtra por periodo no
      // backend — os parametros de data sao ignorados; ver nota na UI).
      const orderStats = await AdminOrderService.getOrderStatistics(
        start.toISOString(),
        now.toISOString(),
      );

      const realStats: ReportStats = {
        // KPIs reais vindos do backend.
        totalOrders: orderStats.totalOrders || 0,
        totalRevenue: orderStats.totalRevenue || 0,
        avgOrderValue: orderStats.averageOrderValue || 0,
        // Sem backend: o endpoint de estatisticas NAO expoe total de clientes.
        totalCustomers: 0,
        // Sem backend: nao ha endpoint de produtos mais vendidos.
        topProducts: [],
        // Distribuicao REAL por status (a partir dos buckets de /orders/statistics).
        ordersByStatus: [
          { status: "Pendentes", count: orderStats.pendingOrders || 0 },
          { status: "Concluídos", count: orderStats.completedOrders || 0 },
          { status: "Cancelados", count: orderStats.cancelledOrders || 0 },
        ].filter((s) => s.count > 0),
        // Sem backend: nao ha endpoint de receita por periodo/mes.
        revenueByMonth: [],
      };

      setStats(realStats);
    } catch (error: any) {
      console.error("Failed to load report data:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao carregar dados do relatório: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: "csv" | "excel" | "pdf") => {
    // Sem backend: nao ha endpoint de exportacao de relatorios.
    toast.info(
      `Exportação em ${format.toUpperCase()} ainda não disponível (backend pendente)`,
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Relatórios e Análises
          </h1>
          <p className="text-gray-600">
            Análise detalhada do desempenho da loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExportReport("csv")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={() => handleExportReport("excel")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => handleExportReport("pdf")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === "custom" && (
              <>
                <div>
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="report-type">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Visão Geral</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="customers">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={loadReportData} className="mt-4">
            Atualizar Relatório
          </Button>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Receita acumulada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.avgOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ticket médio geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
            <p className="text-xs text-muted-foreground">
              Sem dados (backend pendente)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart — sem backend de receita por periodo */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
              <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                Sem dados históricos de receita por período.
              </p>
              <p className="text-xs">
                Endpoint de receita por mês ainda não disponível no backend.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Pie Chart — dados REAIS de /orders/statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.ordersByStatus?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum pedido no período.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.ordersByStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(stats?.ordersByStatus || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(stats?.topProducts?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                Sem dados de produtos mais vendidos.
              </p>
              <p className="text-xs">
                Endpoint de ranking de produtos ainda não disponível no backend.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">
                    Quantidade Vendida
                  </TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.topProducts || []).map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
