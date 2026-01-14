import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Product Card Skeleton
export const ProductCardSkeleton = memo(() => (
  <div className="space-y-3">
    <Skeleton className="aspect-square w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
));

ProductCardSkeleton.displayName = "ProductCardSkeleton";

// Product Grid Skeleton
export const ProductGridSkeleton = memo(({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }, (_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
));

ProductGridSkeleton.displayName = "ProductGridSkeleton";

// Order Item Skeleton
export const OrderItemSkeleton = memo(() => (
  <div className="flex items-center space-x-4 p-4">
    <Skeleton className="h-16 w-16 rounded" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
));

OrderItemSkeleton.displayName = "OrderItemSkeleton";

// Order List Skeleton
export const OrderListSkeleton = memo(({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48 mt-2" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 2 }, (_, j) => (
            <OrderItemSkeleton key={j} />
          ))}
        </div>
      </div>
    ))}
  </div>
));

OrderListSkeleton.displayName = "OrderListSkeleton";

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton = memo(() => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="p-6 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
));

DashboardStatsSkeleton.displayName = "DashboardStatsSkeleton";

// Table Skeleton
export const TableSkeleton = memo(
  ({
    rows = 5,
    columns = 4,
    showHeader = true,
  }: {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
  }) => (
    <div className="border rounded-lg overflow-hidden">
      {showHeader && (
        <div className="border-b bg-gray-50 p-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="p-4">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }, (_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
);

TableSkeleton.displayName = "TableSkeleton";

// Form Skeleton
export const FormSkeleton = memo(({ fields = 6 }: { fields?: number }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
));

FormSkeleton.displayName = "FormSkeleton";

// Chart Skeleton
export const ChartSkeleton = memo(({ height = 300 }: { height?: number }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex items-end space-x-2" style={{ height }}>
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
    <div className="flex justify-between">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
));

ChartSkeleton.displayName = "ChartSkeleton";

// Page Header Skeleton
export const PageHeaderSkeleton = memo(() => (
  <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  </div>
));

PageHeaderSkeleton.displayName = "PageHeaderSkeleton";

// Generic Loading Skeleton with pulse animation
export const LoadingSkeleton = memo(
  ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn("animate-pulse bg-gray-200 rounded", className)}
      {...props}
    >
      {children}
    </div>
  )
);

LoadingSkeleton.displayName = "LoadingSkeleton";

// Smart Skeleton Component - adapts based on content type
export const SmartSkeleton = memo(
  ({
    type,
    count,
    ...props
  }: {
    type:
      | "product-grid"
      | "product-card"
      | "order-list"
      | "table"
      | "form"
      | "chart"
      | "stats";
    count?: number;
  } & any) => {
    switch (type) {
      case "product-grid":
        return <ProductGridSkeleton count={count} {...props} />;
      case "product-card":
        return <ProductCardSkeleton {...props} />;
      case "order-list":
        return <OrderListSkeleton count={count} {...props} />;
      case "table":
        return <TableSkeleton rows={count} {...props} />;
      case "form":
        return <FormSkeleton fields={count} {...props} />;
      case "chart":
        return <ChartSkeleton {...props} />;
      case "stats":
        return <DashboardStatsSkeleton {...props} />;
      default:
        return <Skeleton className="h-20 w-full" {...props} />;
    }
  }
);

SmartSkeleton.displayName = "SmartSkeleton";
