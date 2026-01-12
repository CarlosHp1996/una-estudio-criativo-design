import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrderService } from "@/services/orderService";
import { Order } from "@/types/api";
import { parseApiError } from "@/lib/errorHandling";
import { toast } from "sonner";
import {
  CheckCircle,
  Package,
  Truck,
  X,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const orderCreated = location.state?.orderCreated;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate("/pedidos");
      return;
    }
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orderData = await OrderService.getOrderById(orderId!);
      setOrder(orderData);
    } catch (error: any) {
      console.error("Failed to load order:", error);
      const errorMessage = parseApiError(error).message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setIsCanceling(true);
      const updatedOrder = await OrderService.cancelOrder(order.id);
      setOrder(updatedOrder);
      toast.success("Pedido cancelado com sucesso!");
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      const errorMessage = parseApiError(error).message;
      toast.error(errorMessage);
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "processing":
        return "Processando";
      case "shipped":
        return "Enviado";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: "pending" | "approved" | "failed") => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "approved":
        return "Aprovado";
      case "failed":
        return "Falhou";
      default:
        return status;
    }
  };

  const canCancelOrder =
    order && ["pending", "processing"].includes(order.status);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" />
            <span className="ml-2 text-muted-foreground">
              Carregando pedido...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <Card className="p-8 text-center">
            <div className="mb-4">
              <X className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h1 className="text-2xl font-semibold text-foreground">
                Pedido não encontrado
              </h1>
              <p className="text-muted-foreground mt-2">
                {error || "O pedido solicitado não foi encontrado."}
              </p>
            </div>
            <Button onClick={() => navigate("/pedidos")} variant="outline">
              Ver Todos os Pedidos
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">
                Pedido #{order.orderNumber}
              </h1>
              {orderCreated && (
                <div className="flex items-center mt-2 text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">
                    Pedido criado com sucesso!
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
              {canCancelOrder && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isCanceling}>
                      {isCanceling ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        "Cancelar Pedido"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar este pedido? Esta ação
                        não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelOrder}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Sim, Cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Itens do Pedido
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <h3 className="font-medium text-foreground">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity} × R${" "}
                        {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        R$ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Endereço de Entrega
              </h2>
              <div className="text-muted-foreground">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>CEP: {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Resumo
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="ml-auto font-medium">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Pagamento:</span>
                  <span className="ml-auto font-medium">
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-semibold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">
                      R$ {order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Ações
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/pedidos")}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Todos os Pedidos
                </Button>
                <Button
                  onClick={() => navigate("/produtos")}
                  variant="outline"
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Continuar Comprando
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
