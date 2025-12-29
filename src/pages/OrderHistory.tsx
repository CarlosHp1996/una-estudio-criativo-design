import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
} from "lucide-react";

// Mock data - em um app real viria da API
const mockOrders = [
  {
    id: "ORD-001",
    date: "2024-12-26",
    total: 189.9,
    status: "delivered",
    items: [
      { name: "Camiseta Básica Preta", quantity: 2, price: 49.9 },
      { name: "Calça Jeans Skinny", quantity: 1, price: 89.9 },
    ],
    trackingCode: "BR123456789",
    estimatedDelivery: "2024-12-28",
  },
  {
    id: "ORD-002",
    date: "2024-12-20",
    total: 350.0,
    status: "processing",
    items: [
      { name: "Vestido Floral Midi", quantity: 1, price: 159.9 },
      { name: "Sandália de Couro", quantity: 1, price: 190.0 },
    ],
    trackingCode: null,
    estimatedDelivery: "2024-12-30",
  },
  {
    id: "ORD-003",
    date: "2024-12-15",
    total: 125.5,
    status: "delivered",
    items: [
      { name: "Blusa Manga Longa", quantity: 1, price: 79.9 },
      { name: "Saia Plissada", quantity: 1, price: 45.6 },
    ],
    trackingCode: "BR987654321",
    estimatedDelivery: "2024-12-18",
  },
  {
    id: "ORD-004",
    date: "2024-12-10",
    total: 450.0,
    status: "cancelled",
    items: [
      { name: "Jaqueta Couro Sintético", quantity: 1, price: 289.9 },
      { name: "Bota Ankle Boot", quantity: 1, price: 160.0 },
    ],
    trackingCode: null,
    estimatedDelivery: null,
  },
  {
    id: "ORD-005",
    date: "2024-12-05",
    total: 89.9,
    status: "delivered",
    items: [
      { name: "Top Cropped Básico", quantity: 1, price: 39.9 },
      { name: "Short Jeans Alto", quantity: 1, price: 49.9 },
    ],
    trackingCode: "BR555777999",
    estimatedDelivery: "2024-12-08",
  },
];

export function OrderHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      case "shipped":
        return "Enviado";
      default:
        return "Pendente";
    }
  };

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: mockOrders.length,
    delivered: mockOrders.filter((o) => o.status === "delivered").length,
    processing: mockOrders.filter((o) => o.status === "processing").length,
    cancelled: mockOrders.filter((o) => o.status === "cancelled").length,
    totalSpent: mockOrders.reduce(
      (sum, order) => (order.status !== "cancelled" ? sum + order.total : sum),
      0
    ),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Histórico de Pedidos
        </h1>
        <p className="text-gray-600">
          Acompanhe todos os seus pedidos e entregas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de Pedidos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {orderStats.total}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregues</p>
                <p className="text-2xl font-bold text-green-600">
                  {orderStats.delivered}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processando</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orderStats.processing}
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
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-gray-900">
                  R${" "}
                  {orderStats.totalSpent.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número do pedido ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="delivered">Entregues</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="shipped">Enviados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold">#{order.id}</h3>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(order.status)}
                    >
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(order.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "itens"}
                    </p>
                    {order.trackingCode && (
                      <p>
                        Código de rastreamento:{" "}
                        <span className="font-medium">
                          {order.trackingCode}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <p className="text-lg font-bold">
                    R${" "}
                    {order.total.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === order.id ? null : order.id
                      )
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {expandedOrder === order.id ? "Ocultar" : "Ver detalhes"}
                  </Button>
                </div>
              </div>

              {expandedOrder === order.id && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium">Itens do pedido:</h4>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          R${" "}
                          {item.price.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    ))}

                    {order.status === "processing" &&
                      order.estimatedDelivery && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            <strong>Previsão de entrega:</strong>{" "}
                            {new Date(
                              order.estimatedDelivery
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}

                    {order.status === "delivered" && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Pedido entregue com sucesso!</strong>
                        </p>
                      </div>
                    )}

                    {order.status === "cancelled" && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>Este pedido foi cancelado.</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Você ainda não fez nenhum pedido"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
