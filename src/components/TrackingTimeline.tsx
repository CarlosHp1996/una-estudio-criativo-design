import React from "react";
import { CheckCircle, Circle, MapPin, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tracking, TrackingHistory } from "../types/api";
import { TrackingService } from "../services/trackingService";

interface TrackingTimelineProps {
  tracking: Tracking;
}

export function TrackingTimeline({ tracking }: TrackingTimelineProps) {
  // Sort history by timestamp (most recent first)
  const sortedHistory = [...tracking.history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const isCurrentStatus = (historyItem: TrackingHistory) => {
    return historyItem.status === tracking.status;
  };

  const isDelivered = () => {
    return tracking.status === "delivered";
  };

  const getTimelineItemIcon = (historyItem: TrackingHistory, index: number) => {
    if (isCurrentStatus(historyItem)) {
      return <CheckCircle className="h-5 w-5 text-green-600 fill-green-100" />;
    }

    if (index === 0) {
      return <Circle className="h-5 w-5 text-blue-600 fill-blue-100" />;
    }

    return <CheckCircle className="h-5 w-5 text-gray-400 fill-gray-100" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Histórico de Rastreamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {sortedHistory.map((historyItem, index) => {
            const { date, time } = formatDateTime(historyItem.timestamp);
            const isCurrent = isCurrentStatus(historyItem);

            return (
              <div
                key={index}
                className="relative flex items-start gap-4 pb-8 last:pb-0"
              >
                {/* Timeline node */}
                <div className="relative z-10 flex-shrink-0">
                  {getTimelineItemIcon(historyItem, index)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={isCurrent ? "default" : "secondary"}
                        className={`${TrackingService.getStatusColor(
                          historyItem.status
                        )} font-medium`}
                      >
                        {TrackingService.getStatusIcon(historyItem.status)}{" "}
                        {TrackingService.getStatusLabel(historyItem.status)}
                      </Badge>

                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          Status Atual
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      {historyItem.description}
                    </p>
                    {historyItem.location && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {historyItem.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery status summary */}
        {isDelivered() && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                ✅ Entrega Realizada com Sucesso!
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Sua encomenda foi entregue. Se você não recebeu o produto, entre
              em contato conosco.
            </p>
          </div>
        )}

        {/* Empty state */}
        {sortedHistory.length === 0 && (
          <div className="text-center py-8">
            <Circle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Aguardando primeira atualização
            </p>
            <p className="text-sm text-gray-500 mt-1">
              O rastreamento será atualizado assim que a transportadora
              processar a encomenda
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
