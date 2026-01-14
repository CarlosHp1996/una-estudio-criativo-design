import { memo, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SmartProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  showETA?: boolean;
  animated?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  startTime?: number;
}

export const SmartProgress = memo(
  ({
    value = 0,
    max = 100,
    className,
    showPercentage = true,
    showETA = false,
    animated = true,
    color = "primary",
    size = "md",
    startTime,
  }: SmartProgressProps) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [eta, setETA] = useState<string>("");

    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // Smooth animation for progress
    useEffect(() => {
      if (!animated) {
        setDisplayValue(percentage);
        return;
      }

      const duration = 300; // ms
      const steps = 30;
      const stepValue = (percentage - displayValue) / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayValue((prev) => prev + stepValue);

        if (currentStep >= steps) {
          setDisplayValue(percentage);
          clearInterval(interval);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }, [percentage, animated, displayValue]);

    // Calculate ETA
    const calculateETA = useCallback(() => {
      if (!startTime || percentage === 0) return "";

      const elapsed = Date.now() - startTime;
      const rate = percentage / elapsed; // percentage per ms
      const remaining = 100 - percentage;
      const etaMs = remaining / rate;

      if (etaMs < 60000) {
        // Less than 1 minute
        return `${Math.ceil(etaMs / 1000)}s remaining`;
      } else if (etaMs < 3600000) {
        // Less than 1 hour
        return `${Math.ceil(etaMs / 60000)}m remaining`;
      } else {
        return `${Math.ceil(etaMs / 3600000)}h remaining`;
      }
    }, [startTime, percentage]);

    useEffect(() => {
      if (showETA) {
        setETA(calculateETA());
      }
    }, [showETA, calculateETA]);

    const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    const colorClasses = {
      primary: "bg-primary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
    };

    return (
      <div className={cn("w-full space-y-2", className)}>
        {/* Progress Bar */}
        <div
          className={cn(
            "relative overflow-hidden rounded-full bg-gray-200",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-full",
              colorClasses[color],
              animated && "transition-transform"
            )}
            style={{
              width: `${displayValue}%`,
              transform: animated ? "translateZ(0)" : undefined,
            }}
          >
            {/* Animated stripe effect for ongoing progress */}
            {animated && percentage > 0 && percentage < 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            )}
          </div>
        </div>

        {/* Progress Info */}
        {(showPercentage || showETA) && (
          <div className="flex justify-between items-center text-sm text-gray-600">
            {showPercentage && (
              <span className="font-medium">{Math.round(displayValue)}%</span>
            )}
            {showETA && eta && <span className="text-xs">{eta}</span>}
          </div>
        )}
      </div>
    );
  }
);

SmartProgress.displayName = "SmartProgress";

// Upload Progress Component
export const UploadProgress = memo(
  ({
    files,
    className,
  }: {
    files: Array<{
      name: string;
      progress: number;
      size?: number;
      status?: "uploading" | "completed" | "error";
    }>;
    className?: string;
  }) => {
    const totalProgress =
      files.reduce((acc, file) => acc + file.progress, 0) / files.length;

    return (
      <div className={cn("space-y-4", className)}>
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Upload Progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <SmartProgress
            value={totalProgress}
            color="primary"
            showPercentage={false}
          />
        </div>

        {/* Individual File Progress */}
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate max-w-[200px]" title={file.name}>
                  {file.name}
                </span>
                <div className="flex items-center gap-2">
                  {file.size && (
                    <span className="text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      file.status === "completed" &&
                        "bg-green-100 text-green-800",
                      file.status === "error" && "bg-red-100 text-red-800",
                      file.status === "uploading" && "bg-blue-100 text-blue-800"
                    )}
                  >
                    {file.status === "completed" && "✓ Complete"}
                    {file.status === "error" && "✗ Error"}
                    {file.status === "uploading" &&
                      `${Math.round(file.progress)}%`}
                  </span>
                </div>
              </div>
              <SmartProgress
                value={file.progress}
                color={
                  file.status === "completed"
                    ? "success"
                    : file.status === "error"
                    ? "error"
                    : "primary"
                }
                size="sm"
                showPercentage={false}
                animated={file.status === "uploading"}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

UploadProgress.displayName = "UploadProgress";

// Loading Progress for Page Transitions
export const PageProgress = memo(() => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsVisible(true);
      setProgress(10);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    };

    // Simulate progress for demo
    // In real app, this would be triggered by router events
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-1 bg-primary transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

PageProgress.displayName = "PageProgress";

export default SmartProgress;
