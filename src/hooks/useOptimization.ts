import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// Hook para debouncing de valores
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttling de funções
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
}

// Hook para otimizar re-renders com memoização inteligente
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined,
  isEqual?: (a: T, b: T) => boolean
): T {
  const prevResult = useRef<T>();
  const prevDeps = useRef<React.DependencyList | undefined>();

  return useMemo(() => {
    // Se não há dependências, sempre recalcular
    if (!deps) {
      const result = factory();
      prevResult.current = result;
      prevDeps.current = deps;
      return result;
    }

    // Comparar dependências
    let depsChanged = false;
    if (!prevDeps.current || prevDeps.current.length !== deps.length) {
      depsChanged = true;
    } else {
      for (let i = 0; i < deps.length; i++) {
        if (deps[i] !== prevDeps.current[i]) {
          depsChanged = true;
          break;
        }
      }
    }

    // Se dependências não mudaram, retornar resultado anterior
    if (!depsChanged && prevResult.current !== undefined) {
      return prevResult.current;
    }

    // Calcular novo resultado
    const result = factory();

    // Se função de comparação personalizada foi fornecida, usar ela
    if (isEqual && prevResult.current !== undefined) {
      if (isEqual(result, prevResult.current)) {
        return prevResult.current; // Retornar referência anterior para manter identidade
      }
    }

    prevResult.current = result;
    prevDeps.current = deps;
    return result;
  }, deps);
}

// Hook para async data fetching com cache e otimizações
export function useAsyncData<T, E = Error>(
  fetchFunction: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: {
    initialData?: T;
    retryCount?: number;
    retryDelay?: number;
    cache?: boolean;
    cacheTime?: number;
  } = {}
) {
  const {
    initialData,
    retryCount = 3,
    retryDelay = 1000,
    cache = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<E | null>(null);
  const [retries, setRetries] = useState<number>(0);

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController>();

  // Gerar chave de cache baseada nas dependências
  const cacheKey = useMemo(() => {
    return JSON.stringify(dependencies);
  }, dependencies);

  // Função para buscar dados com retry
  const fetchData = useCallback(
    async (currentRetry = 0): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Cancelar requisição anterior se existir
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        // Verificar cache primeiro
        if (cache) {
          const cached = cacheRef.current.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < cacheTime) {
            setData(cached.data);
            setLoading(false);
            return;
          }
        }

        const result = await fetchFunction();

        // Armazenar no cache
        if (cache) {
          cacheRef.current.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }

        setData(result);
        setRetries(0);
      } catch (err) {
        const error = err as E;

        if (currentRetry < retryCount) {
          setRetries(currentRetry + 1);
          setTimeout(() => {
            fetchData(currentRetry + 1);
          }, retryDelay * Math.pow(2, currentRetry)); // Exponential backoff
        } else {
          setError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, cacheKey, cache, cacheTime, retryCount, retryDelay]
  );

  // Função para revalidar dados manualmente
  const revalidate = useCallback(() => {
    if (cache) {
      cacheRef.current.delete(cacheKey);
    }
    fetchData();
  }, [fetchData, cacheKey, cache]);

  // Função para limpar cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  useEffect(() => {
    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, dependencies);

  return {
    data,
    loading,
    error,
    retries,
    revalidate,
    clearCache,
  };
}

// Hook para detectar mudanças de viewport
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Throttle resize events
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Breakpoint helpers
  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const isDesktop = viewport.width >= 1024;

  return {
    viewport,
    isMobile,
    isTablet,
    isDesktop,
  };
}

// Hook para intersection observer otimizado
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return { entry, isIntersecting };
}

// Hook para performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>(performance.now());

  useEffect(() => {
    renderCount.current += 1;
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        renderTime: `${renderTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
  };
}
