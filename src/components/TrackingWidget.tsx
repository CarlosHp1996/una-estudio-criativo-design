import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Truck, Package, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Order } from "../types/api";
import { TrackingService } from "../services/trackingService";
import { useTrackingPolling } from "../hooks/useTrackingPolling";

interface TrackingWidgetProps {
  orders: Order[];
  title?: string;
}

export function TrackingWidget({
  orders,
  title = "Pedidos em Trânsito",
}: TrackingWidgetProps) {
  const navigate = useNavigate();

  // Get orders with tracking codes that are not yet delivered
  const trackableOrders = orders.filter(
    (order) =>
      order.trackingCode && !["delivered", "cancelled"].includes(order.status),
  );

  const handleTrackOrder = (trackingCode: string) => {
    navigate(`/rastreamento?codigo=${trackingCode}`);
  };

  if (trackableOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Nenhum pedido em trânsito
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Seus pedidos aparecerão aqui quando forem enviados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trackableOrders.map((order) => (
            <TrackableOrderItem
              key={order.id}
              order={order}
              onTrack={handleTrackOrder}
            />
          ))}
          {trackableOrders.length > 0 && (
            <Button
              onClick={() => navigate("/rastreamento")}
              variant="outline"
              className="w-full mt-4"
            >
              <Search className="h-4 w-4 mr-2" />
              Rastrear Outro Pedido
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrackableOrderItemProps {
  order: Order;
  onTrack: (trackingCode: string) => void;
}

function TrackableOrderItem({ order, onTrack }: TrackableOrderItemProps) {
  // Use polling for this specific order
  const { tracking, isPolling } = useTrackingPolling({
    trackingCode: order.trackingCode,
    enabled: !!order.trackingCode,
    pollingInterval: 45000, // Slower polling for widget (45s)
    onStatusChange: (oldStatus, newStatus) => {
      // Polling will update the display automatically
    },
  });

  const currentStatus = tracking?.status || order.status;
  const displayTracking = tracking || {
    trackingCode: order.trackingCode,
    status: order.status,
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm font-medium">
            #{order.orderNumber}
          </span>
          {isPolling && (
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              title="Monitorando"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`${TrackingService.getStatusColor(
              currentStatus,
            )} text-xs`}
          >
            {TrackingService.getStatusIcon(currentStatus)}{" "}
            {TrackingService.getStatusLabel(currentStatus)}
          </Badge>
          <span className="text-xs text-gray-500 font-mono">
            {order.trackingCode}
          </span>
        </div>
      </div>
      <Button
        onClick={() => order.trackingCode && onTrack(order.trackingCode)}
        variant="outline"
        size="sm"
        className="flex-shrink-0"
      >
        <Truck className="h-3 w-3 mr-1" />
        Rastrear
      </Button>
    </div>
  );
}
