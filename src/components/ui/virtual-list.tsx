import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { cn } from "@/lib/utils";

interface VirtualListItem {
  id: string | number;
  height?: number;
}

interface VirtualListProps<T extends VirtualListItem> {
  items: T[];
  height: number; // Container height
  itemHeight: number | ((item: T, index: number) => number); // Fixed or dynamic height
  renderItem: (
    item: T,
    index: number,
    style: React.CSSProperties
  ) => React.ReactNode;
  overscan?: number; // Number of items to render outside visible area
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export const VirtualList = memo(
  <T extends VirtualListItem>({
    items,
    height,
    itemHeight,
    renderItem,
    overscan = 5,
    className,
    onScroll,
    getItemKey = (item, index) => item.id ?? index,
  }: VirtualListProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate item heights and positions
    const itemMetrics = useMemo(() => {
      let totalHeight = 0;
      const positions: number[] = [];
      const heights: number[] = [];

      items.forEach((item, index) => {
        positions[index] = totalHeight;
        const height =
          typeof itemHeight === "function"
            ? itemHeight(item, index)
            : itemHeight;
        heights[index] = height;
        totalHeight += height;
      });

      return { positions, heights, totalHeight };
    }, [items, itemHeight]);

    // Find visible range
    const visibleRange = useMemo(() => {
      const { positions, heights } = itemMetrics;

      if (positions.length === 0) {
        return { start: 0, end: 0 };
      }

      // Binary search to find start index
      let start = 0;
      let end = positions.length - 1;

      while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        const position = positions[mid];

        if (position <= scrollTop) {
          start = mid + 1;
        } else {
          end = mid - 1;
        }
      }

      const startIndex = Math.max(0, end);

      // Find end index
      let endIndex = startIndex;
      let currentHeight = 0;

      while (endIndex < positions.length && currentHeight < height) {
        currentHeight += heights[endIndex];
        endIndex++;
      }

      return {
        start: Math.max(0, startIndex - overscan),
        end: Math.min(items.length - 1, endIndex + overscan),
      };
    }, [scrollTop, height, itemMetrics, overscan, items.length]);

    // Handle scroll
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
      },
      [onScroll]
    );

    // Render visible items
    const visibleItems = useMemo(() => {
      const { positions, heights } = itemMetrics;
      const result = [];

      for (let i = visibleRange.start; i <= visibleRange.end; i++) {
        if (i >= items.length) break;

        const item = items[i];
        const top = positions[i];
        const itemHeight = heights[i];

        const style: React.CSSProperties = {
          position: "absolute",
          top: `${top}px`,
          left: 0,
          right: 0,
          height: `${itemHeight}px`,
        };

        result.push(
          <div key={getItemKey(item, i)} style={style}>
            {renderItem(item, i, style)}
          </div>
        );
      }

      return result;
    }, [visibleRange, items, itemMetrics, renderItem, getItemKey]);

    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-auto", className)}
        style={{ height }}
        onScroll={handleScroll}
      >
        {/* Virtual space to maintain scroll height */}
        <div style={{ height: itemMetrics.totalHeight, position: "relative" }}>
          {visibleItems}
        </div>
      </div>
    );
  }
) as <T extends VirtualListItem>(props: VirtualListProps<T>) => JSX.Element;

VirtualList.displayName = "VirtualList";

// Optimized Product List Component
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface VirtualProductListProps {
  products: Product[];
  height: number;
  onProductClick?: (product: Product) => void;
  className?: string;
}

export const VirtualProductList = memo(
  ({
    products,
    height,
    onProductClick,
    className,
  }: VirtualProductListProps) => {
    const renderProduct = useCallback(
      (product: Product, index: number, style: React.CSSProperties) => (
        <div
          className="flex items-center gap-4 p-4 border-b hover:bg-gray-50 cursor-pointer"
          onClick={() => onProductClick?.(product)}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-gray-600 truncate mt-1">
                {product.description}
              </p>
            )}
            <p className="text-sm font-semibold text-green-600 mt-2">
              R$ {product.price.toFixed(2)}
            </p>
          </div>
        </div>
      ),
      [onProductClick]
    );

    return (
      <VirtualList
        items={products}
        height={height}
        itemHeight={88} // Fixed height for product items
        renderItem={renderProduct}
        className={className}
        overscan={3}
      />
    );
  }
);

VirtualProductList.displayName = "VirtualProductList";

// Infinite Scroll Virtual List
interface InfiniteVirtualListProps<T extends VirtualListItem>
  extends Omit<VirtualListProps<T>, "items"> {
  items: T[];
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loadingComponent?: React.ReactNode;
}

export const InfiniteVirtualList = memo(
  <T extends VirtualListItem>({
    items,
    hasNextPage,
    isLoading,
    onLoadMore,
    loadingComponent,
    ...virtualListProps
  }: InfiniteVirtualListProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);

    // Enhanced items with loading indicator
    const enhancedItems = useMemo(() => {
      const result = [...items];

      if (hasNextPage || isLoading) {
        result.push({
          id: "loading-indicator",
          height: 60,
        } as T);
      }

      return result;
    }, [items, hasNextPage, isLoading]);

    // Enhanced render function
    const renderItem = useCallback(
      (item: T, index: number, style: React.CSSProperties) => {
        // Loading indicator
        if (item.id === "loading-indicator") {
          return (
            <div className="flex justify-center items-center p-4">
              {loadingComponent || (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              )}
            </div>
          );
        }

        return virtualListProps.renderItem(item, index, style);
      },
      [virtualListProps.renderItem, loadingComponent]
    );

    // Handle scroll for infinite loading
    const handleScroll = useCallback(
      (scrollTop: number) => {
        setScrollTop(scrollTop);
        virtualListProps.onScroll?.(scrollTop);

        // Check if we're near the bottom
        const container = document.querySelector("[data-virtual-list]");
        if (container) {
          const { scrollHeight, clientHeight } = container;
          const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

          if (scrollPercentage > 0.8 && hasNextPage && !isLoading) {
            onLoadMore();
          }
        }
      },
      [virtualListProps.onScroll, hasNextPage, isLoading, onLoadMore]
    );

    return (
      <div data-virtual-list>
        <VirtualList
          {...virtualListProps}
          items={enhancedItems}
          renderItem={renderItem}
          onScroll={handleScroll}
        />
      </div>
    );
  }
) as <T extends VirtualListItem>(
  props: InfiniteVirtualListProps<T>
) => JSX.Element;

InfiniteVirtualList.displayName = "InfiniteVirtualList";

// Grid Virtual List for cards/tiles
interface VirtualGridProps<T extends VirtualListItem> {
  items: T[];
  height: number;
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualGrid = memo(
  <T extends VirtualListItem>({
    items,
    height,
    itemWidth,
    itemHeight,
    gap = 16,
    renderItem,
    className,
  }: VirtualGridProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate grid metrics
    const gridMetrics = useMemo(() => {
      if (containerWidth === 0) return { columns: 1, rows: 0, totalHeight: 0 };

      const columns = Math.floor((containerWidth + gap) / (itemWidth + gap));
      const rows = Math.ceil(items.length / columns);
      const totalHeight = rows * (itemHeight + gap) - gap;

      return { columns, rows, totalHeight };
    }, [containerWidth, itemWidth, itemHeight, gap, items.length]);

    // Observe container width changes
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        setContainerWidth(entry.contentRect.width);
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    // Calculate visible items
    const visibleItems = useMemo(() => {
      const { columns } = gridMetrics;
      if (columns === 0) return [];

      const startRow = Math.floor(scrollTop / (itemHeight + gap));
      const endRow = Math.ceil((scrollTop + height) / (itemHeight + gap));

      const startIndex = Math.max(0, startRow * columns);
      const endIndex = Math.min(items.length - 1, endRow * columns - 1);

      const result = [];

      for (let i = startIndex; i <= endIndex; i++) {
        if (i >= items.length) break;

        const item = items[i];
        const row = Math.floor(i / columns);
        const col = i % columns;

        const x = col * (itemWidth + gap);
        const y = row * (itemHeight + gap);

        result.push(
          <div
            key={item.id ?? i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, i)}
          </div>
        );
      }

      return result;
    }, [
      items,
      gridMetrics,
      scrollTop,
      height,
      itemWidth,
      itemHeight,
      gap,
      renderItem,
    ]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-auto", className)}
        style={{ height }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: gridMetrics.totalHeight,
            position: "relative",
            width: "100%",
          }}
        >
          {visibleItems}
        </div>
      </div>
    );
  }
) as <T extends VirtualListItem>(props: VirtualGridProps<T>) => JSX.Element;

VirtualGrid.displayName = "VirtualGrid";
