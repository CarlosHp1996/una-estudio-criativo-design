import { useState, useEffect, useRef } from "react";
import { TrackingService } from "../services/trackingService";
import { Tracking } from "../types/api";
import { toast } from "sonner";

interface UseTrackingPollingOptions {
  trackingCode?: string;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
  onStatusChange?: (
    oldStatus: string,
    newStatus: string,
    tracking: Tracking
  ) => void;
}

export function useTrackingPolling({
  trackingCode,
  enabled = true,
  pollingInterval = 30000, // 30 seconds default
  onStatusChange,
}: UseTrackingPollingOptions) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  const fetchTracking = async (code: string) => {
    try {
      const trackingData = await TrackingService.getTrackingByCode(code);
      const oldStatus = lastStatusRef.current;
      const newStatus = trackingData.status;

      setTracking(trackingData);
      setError(null);

      // Check if status changed
      if (oldStatus && oldStatus !== newStatus) {
        // Trigger status change callback
        onStatusChange?.(oldStatus, newStatus, trackingData);

        // Show toast notification
        toast.success(
          `Status atualizado: ${TrackingService.getStatusLabel(newStatus)}`,
          {
            description: `Seu pedido #${code} teve o status alterado`,
            action: {
              label: "Ver Detalhes",
              onClick: () => {
                // Could navigate to tracking page or open modal
                window.location.href = `/rastreamento?codigo=${code}`;
              },
            },
          }
        );
      }

      lastStatusRef.current = newStatus;
    } catch (error: any) {
      console.error("Polling error:", error);
      setError(
        error.response?.status === 404
          ? "Código não encontrado"
          : "Erro na consulta"
      );
    }
  };

  const startPolling = () => {
    if (!trackingCode || !enabled) return;

    setIsPolling(true);

    // Initial fetch
    fetchTracking(trackingCode);

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchTracking(trackingCode);
    }, pollingInterval);
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Auto start/stop based on dependencies
  useEffect(() => {
    if (trackingCode && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [trackingCode, enabled, pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    tracking,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refetch: () => trackingCode && fetchTracking(trackingCode),
  };
}
