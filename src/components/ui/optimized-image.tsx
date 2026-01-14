import { useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
  fallback?: string;
}

const OptimizedImage = memo(
  ({
    src,
    alt,
    className,
    width,
    height,
    priority = false,
    placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIwJSI+PHN0b3Agc3RvcC1jb2xvcj0iI2YzZjRmNiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2U1ZTdlYiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+",
    fallback,
  }: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoaded(true);
    }, []);

    // Intersection Observer for lazy loading
    const imgRef = useCallback(
      (node: HTMLImageElement | null) => {
        if (node && !priority && !isInView) {
          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                setIsInView(true);
                observer.unobserve(node);
              }
            },
            {
              rootMargin: "50px",
              threshold: 0.1,
            }
          );
          observer.observe(node);
          return () => observer.unobserve(node);
        }
      },
      [priority, isInView]
    );

    // Generate optimized src based on device capabilities
    const getOptimizedSrc = useCallback(
      (originalSrc: string, targetWidth?: number) => {
        // If it's already an optimized URL or data URL, return as is
        if (
          originalSrc.includes("data:") ||
          originalSrc.includes("optimized")
        ) {
          return originalSrc;
        }

        // For demo purposes, we'll add query params for optimization
        // In a real app, this would integrate with image CDN like Cloudinary, Imagekit, etc.
        const url = new URL(originalSrc, window.location.origin);

        if (targetWidth) {
          url.searchParams.set("w", targetWidth.toString());
        }

        // Add format optimization
        if ("webp" in new Image()) {
          url.searchParams.set("format", "webp");
        }

        // Add quality optimization for non-critical images
        if (!priority) {
          url.searchParams.set("q", "80");
        }

        return url.toString();
      },
      [priority]
    );

    const optimizedSrc = getOptimizedSrc(src, width);
    const shouldShowImage = isInView || priority;

    return (
      <div
        className={cn("relative overflow-hidden", className)}
        style={{ width, height }}
      >
        {/* Placeholder while loading */}
        {!isLoaded && (
          <img
            src={placeholder}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-0" : "opacity-100"
            )}
            aria-hidden="true"
          />
        )}

        {/* Main image */}
        {shouldShowImage && (
          <img
            ref={imgRef}
            src={hasError && fallback ? fallback : optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{
              contentVisibility: priority ? "visible" : "auto",
            }}
          />
        )}

        {/* Loading indicator */}
        {!isLoaded && shouldShowImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
