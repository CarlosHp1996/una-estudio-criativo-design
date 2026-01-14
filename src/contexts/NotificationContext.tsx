import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  timestamp?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const notificationCount = useRef(0);

    // Generate unique ID
    const generateId = useCallback(() => {
      return `notification-${Date.now()}-${++notificationCount.current}`;
    }, []);

    // Add notification
    const addNotification = useCallback(
      (notification: Omit<Notification, "id" | "timestamp">) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          duration:
            notification.duration ??
            (notification.type === "error" ? 8000 : 5000),
        };

        setNotifications((prev) => {
          // Limit to 5 notifications max
          const updated = [newNotification, ...prev].slice(0, 5);
          return updated;
        });

        // Auto-remove if not persistent
        if (
          !newNotification.persistent &&
          newNotification.duration &&
          newNotification.duration > 0
        ) {
          const timeoutId = setTimeout(() => {
            removeNotification(id);
          }, newNotification.duration);

          timeouts.current.set(id, timeoutId);
        }

        return id;
      },
      [generateId]
    );

    // Remove notification
    const removeNotification = useCallback((id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      const timeoutId = timeouts.current.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeouts.current.delete(id);
      }
    }, []);

    // Clear all notifications
    const clearAllNotifications = useCallback(() => {
      setNotifications([]);
      timeouts.current.forEach((timeout) => clearTimeout(timeout));
      timeouts.current.clear();
    }, []);

    // Update notification
    const updateNotification = useCallback(
      (id: string, updates: Partial<Notification>) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
        );
      },
      []
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        timeouts.current.forEach((timeout) => clearTimeout(timeout));
      };
    }, []);

    const value: NotificationContextType = {
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
      updateNotification,
    };

    return (
      <NotificationContext.Provider value={value}>
        {children}
      </NotificationContext.Provider>
    );
  }
);

NotificationProvider.displayName = "NotificationProvider";

// Individual Notification Component
const NotificationComponent = memo(
  ({ notification }: { notification: Notification }) => {
    const { removeNotification } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // Entrance animation
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }, []);

    // Handle close
    const handleClose = useCallback(() => {
      setIsRemoving(true);
      setTimeout(() => {
        removeNotification(notification.id);
        notification.onClose?.();
      }, 200);
    }, [notification.id, notification.onClose, removeNotification]);

    // Icon mapping
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
    };

    const Icon = icons[notification.type];

    // Color mapping
    const colorClasses = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    const iconColors = {
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500",
    };

    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-200 ease-out transform",
          colorClasses[notification.type],
          isVisible && !isRemoving && "translate-x-0 opacity-100",
          !isVisible && "translate-x-full opacity-0",
          isRemoving && "translate-x-full opacity-0 scale-95"
        )}
        style={{
          transform: `translateX(${
            isVisible && !isRemoving ? "0" : "100%"
          }) scale(${isRemoving ? "0.95" : "1"})`,
          opacity: isVisible && !isRemoving ? 1 : 0,
        }}
      >
        {/* Icon */}
        <Icon
          className={cn(
            "w-5 h-5 mt-0.5 flex-shrink-0",
            iconColors[notification.type]
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{notification.title}</div>
          {notification.message && (
            <div className="text-sm opacity-80 mt-1">
              {notification.message}
            </div>
          )}

          {/* Action button */}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
);

NotificationComponent.displayName = "NotificationComponent";

// Notification Container
export const NotificationContainer = memo(() => {
  const { notifications } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationComponent notification={notification} />
        </div>
      ))}
    </div>
  );
});

NotificationContainer.displayName = "NotificationContainer";

// Utility hooks for common notification types
export const useNotify = () => {
  const { addNotification } = useNotifications();

  return {
    success: useCallback(
      (title: string, message?: string, options?: Partial<Notification>) =>
        addNotification({ type: "success", title, message, ...options }),
      [addNotification]
    ),

    error: useCallback(
      (title: string, message?: string, options?: Partial<Notification>) =>
        addNotification({ type: "error", title, message, ...options }),
      [addNotification]
    ),

    warning: useCallback(
      (title: string, message?: string, options?: Partial<Notification>) =>
        addNotification({ type: "warning", title, message, ...options }),
      [addNotification]
    ),

    info: useCallback(
      (title: string, message?: string, options?: Partial<Notification>) =>
        addNotification({ type: "info", title, message, ...options }),
      [addNotification]
    ),
  };
};

// Toast-style notification for quick messages
export const useToast = () => {
  const { addNotification } = useNotifications();

  return useCallback(
    (message: string, type: Notification["type"] = "info") => {
      return addNotification({
        type,
        title: message,
        duration: 3000,
      });
    },
    [addNotification]
  );
};

// Progress notification for long operations
export const useProgressNotification = () => {
  const { addNotification, updateNotification, removeNotification } =
    useNotifications();

  return useCallback(
    (title: string) => {
      const id = addNotification({
        type: "info",
        title,
        persistent: true,
      });

      return {
        update: (progress: number, message?: string) => {
          updateNotification(id, {
            title: `${title} (${Math.round(progress)}%)`,
            message,
          });
        },

        complete: (successMessage?: string) => {
          updateNotification(id, {
            type: "success",
            title: successMessage || "Completed",
            persistent: false,
            duration: 3000,
          });
        },

        error: (errorMessage: string) => {
          updateNotification(id, {
            type: "error",
            title: "Error",
            message: errorMessage,
            persistent: false,
            duration: 5000,
          });
        },

        remove: () => removeNotification(id),
      };
    },
    [addNotification, updateNotification, removeNotification]
  );
};

// Batch notifications for multiple operations
export const useBatchNotifications = () => {
  const { addNotification } = useNotifications();

  return useCallback(
    (notifications: Array<Omit<Notification, "id" | "timestamp">>) => {
      const ids: string[] = [];

      notifications.forEach((notification, index) => {
        setTimeout(() => {
          const id = addNotification(notification);
          ids.push(id);
        }, index * 100); // Stagger notifications
      });

      return ids;
    },
    [addNotification]
  );
};
