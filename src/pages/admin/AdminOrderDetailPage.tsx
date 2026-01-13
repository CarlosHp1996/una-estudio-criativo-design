import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
  Edit,
  Download,
  AlertTriangle,
} from "lucide-react";
import { AdminOrderService } from "@/services/adminOrderService";
import { Order } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      // Assuming the admin service has a method to get order by ID
      // For now, we'll use the getAllOrders and filter
      const response = await AdminOrderService.getAllOrders(1, 1, {
        search: orderId,
      });
      const foundOrder = response.items.find((o) => o.id === orderId);

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error("Pedido não encontrado");
        navigate("/admin/orders");
      }
    } catch (error: any) {
      console.error("Failed to load order details:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao carregar detalhes do pedido: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      await AdminOrderService.updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus });
      toast.success(`Status atualizado para: ${getStatusText(newStatus)}`);
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(`Erro ao atualizar status: ${errorMessage}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendente
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Processando
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Enviado
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Entregue
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusText = (status: Order["status"]) => {
    const statusMap = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
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

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Pedido não encontrado
        </h2>
        <p className="text-gray-600 mb-6">
          O pedido solicitado não foi encontrado.
        </p>
        <Button onClick={() => navigate("/admin/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}{" "}
              às {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <Select
            value={order.status}
            onValueChange={handleStatusUpdate}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.productName}</h3>
                        <p className="text-sm text-gray-600">
                          Quantidade: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          Preço unitário: {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete:</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Método
                  </label>
                  <p className="text-gray-900 capitalize">
                    {order.paymentMethod === "credit_card"
                      ? "Cartão de Crédito"
                      : order.paymentMethod}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div>
                    <Badge
                      variant={
                        order.paymentStatus === "paid" ? "default" : "secondary"
                      }
                      className={
                        order.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {order.paymentStatus === "paid"
                        ? "Pago"
                        : order.paymentStatus === "pending"
                        ? "Pendente"
                        : order.paymentStatus === "failed"
                        ? "Falhou"
                        : order.paymentStatus}
                    </Badge>
                  </div>
                </div>
                {order.transactionId && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">
                      ID da Transação
                    </label>
                    <p className="text-gray-900 font-mono text-sm">
                      {order.transactionId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nome
                  </label>
                  <p className="text-gray-900">
                    {order.shippingAddress.street.split(",")[0]}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">cliente@example.com</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Telefone
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">(11) 99999-9999</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-900">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>{order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Método de Entrega
                  </label>
                  <p className="text-gray-900">Correios - PAC</p>
                </div>
                {order.trackingCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Código de Rastreamento
                    </label>
                    <p className="text-gray-900 font-mono text-sm">
                      {order.trackingCode}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Custo de Entrega
                  </label>
                  <p className="text-gray-900">
                    {formatCurrency(order.shippingCost)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Pedido Criado</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      ["processing", "shipped", "delivered"].includes(
                        order.status
                      )
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">Em Processamento</p>
                    <p className="text-xs text-gray-500">
                      {order.status === "processing" ||
                      order.status === "shipped" ||
                      order.status === "delivered"
                        ? new Date(order.updatedAt).toLocaleString("pt-BR")
                        : "Aguardando"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      ["shipped", "delivered"].includes(order.status)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">Enviado</p>
                    <p className="text-xs text-gray-500">
                      {order.status === "shipped" ||
                      order.status === "delivered"
                        ? new Date(order.updatedAt).toLocaleString("pt-BR")
                        : "Aguardando"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      order.status === "delivered"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">Entregue</p>
                    <p className="text-xs text-gray-500">
                      {order.status === "delivered"
                        ? new Date(order.updatedAt).toLocaleString("pt-BR")
                        : "Aguardando"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
