import { useState, useCallback, memo, useEffect, useRef } from "react";
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
    const containerRef = useRef<HTMLDivElement>(null);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoaded(true);
    }, []);

    // Intersection Observer for lazy loading - observa o container, não a imagem
    useEffect(() => {
      if (!containerRef.current || priority || isInView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        },
        {
          rootMargin: "50px",
          threshold: 0.01,
        }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    }, [priority, isInView]);

    // Generate optimized src based on device capabilities
    const getOptimizedSrc = useCallback(
      (originalSrc: string, targetWidth?: number) => {
        // Return placeholder if src is invalid
        if (!originalSrc || typeof originalSrc !== 'string') {
          return placeholder;
        }

        // If it's already an optimized URL or data URL, return as is
        if (
          originalSrc.includes("data:") ||
          originalSrc.includes("optimized")
        ) {
          return originalSrc;
        }

        // If it's an absolute URL (starts with http:// or https://), return as is
        // Don't try to optimize external or backend URLs
        if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
          return originalSrc;
        }

        // For demo purposes, we'll add query params for optimization
        // In a real app, this would integrate with image CDN like Cloudinary, Imagekit, etc.
        try {
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
        } catch (error) {
          // If URL parsing fails, return original
          console.warn('Failed to parse image URL:', originalSrc, error);
          return originalSrc;
        }
      },
      [priority, placeholder]
    );

    const optimizedSrc = getOptimizedSrc(src, width);
    const shouldShowImage = isInView || priority;

    return (
      <div
        ref={containerRef}
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
