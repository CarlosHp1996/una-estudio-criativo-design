import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useReducer,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import CartService from "@/services/cartService";
import type {
  Cart,
  CartItem as APICartItem,
  AddToCartRequest,
} from "@/types/api";
import { parseApiError, useErrorHandler } from "@/lib/errorHandling";
import { toast } from "sonner";

// Local cart item interface (simplified for UI)
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  productId: string;
}

// Local storage key
const CART_STORAGE_KEY = "una_cart_items";

// Local cart utilities
const localCart = {
  get: (): CartItem[] => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  set: (items: CartItem[]): void => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to save cart to localStorage:", error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear cart from localStorage:", error);
    }
  },

  addItem: (newItem: CartItem): CartItem[] => {
    const items = localCart.get();
    const existingIndex = items.findIndex(
      (item) => item.productId === newItem.productId
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += newItem.quantity;
    } else {
      items.push({
        ...newItem,
        id: `local_${newItem.productId}_${Date.now()}`,
      });
    }

    localCart.set(items);
    return items;
  },

  removeItem: (itemId: string): CartItem[] => {
    const items = localCart.get().filter((item) => item.id !== itemId);
    localCart.set(items);
    return items;
  },

  updateQuantity: (itemId: string, quantity: number): CartItem[] => {
    const items = localCart.get();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        items.splice(itemIndex, 1);
      } else {
        items[itemIndex].quantity = quantity;
      }
    }

    localCart.set(items);
    return items;
  },
};

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  total: number;
  totalItems: number;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Cart state management
interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: "CART_LOADING"; payload: { loading: boolean } }
  | { type: "CART_SUCCESS"; payload: { cart: Cart } }
  | { type: "CART_ERROR"; payload: { error: string } }
  | { type: "CLEAR_ERROR" };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "CART_LOADING":
      return { ...state, isLoading: action.payload.loading };
    case "CART_SUCCESS":
      return {
        ...state,
        cart: action.payload.cart,
        isLoading: false,
        error: null,
      };
    case "CART_ERROR":
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { handleError } = useErrorHandler();
  const [state, dispatch] = useReducer(cartReducer, {
    cart: null,
    isLoading: false,
    error: null,
  });

  // Convert API cart items to UI cart items
  const convertToUIItems = (apiItems: APICartItem[]): CartItem[] => {
    return apiItems.map((item) => ({
      id: item.id,
      name: item.productName,
      price: item.productPrice,
      image: "", // Will need to fetch from product if needed
      quantity: item.quantity,
      productId: item.productId,
    }));
  };

  // Convert UI cart items to API cart items format for local storage
  const convertFromUIItems = (items: CartItem[]): APICartItem[] => {
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.name,
      productPrice: item.price,
      quantity: item.quantity,
    }));
  };

  // Create local cart from UI items
  const createLocalCart = (items: CartItem[]): Cart => {
    const apiItems = convertFromUIItems(items);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: `local-${Date.now()}`,
      userId: user?.id || "guest",
      items: apiItems,
      totalAmount,
      totalItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Sync local cart with backend when user logs in
  const syncLocalCartWithBackend = async () => {
    try {
      const localItems = localCart.get();
      if (localItems.length > 0) {
        dispatch({ type: "CART_LOADING", payload: { loading: true } });

        // Sync each item to backend
        for (const item of localItems) {
          try {
            await CartService.addToCart({
              productId: item.productId,
              quantity: item.quantity,
            });
          } catch (error) {
            console.warn(`Failed to sync item ${item.productId}:`, error);
          }
        }

        // Clear local cart after successful sync
        localCart.clear();

        // Load the updated cart from backend
        const backendCart = await CartService.getCart();
        dispatch({ type: "CART_SUCCESS", payload: { cart: backendCart } });

        toast.success("Carrinho local sincronizado!");
      } else {
        // No local items, just load backend cart
        await loadBackendCart();
      }
    } catch (error) {
      console.error("Failed to sync local cart:", error);
      // Fallback to local cart if sync fails
      const localItems = localCart.get();
      const localCartData = createLocalCart(localItems);
      dispatch({ type: "CART_SUCCESS", payload: { cart: localCartData } });
    }
  };

  // Load cart from backend
  const loadBackendCart = async () => {
    try {
      dispatch({ type: "CART_LOADING", payload: { loading: true } });
      const cart = await CartService.getCart();
      dispatch({ type: "CART_SUCCESS", payload: { cart } });
    } catch (error) {
      console.error("Failed to load cart:", error);
      const errorMessage = parseApiError(error as any).message;
      dispatch({ type: "CART_ERROR", payload: { error: errorMessage } });
    }
  };

  // Load local cart for unauthenticated users
  const loadLocalCart = () => {
    try {
      const localItems = localCart.get();
      const localCartData = createLocalCart(localItems);
      dispatch({ type: "CART_SUCCESS", payload: { cart: localCartData } });
    } catch (error) {
      console.error("Failed to load local cart:", error);
      dispatch({
        type: "CART_ERROR",
        payload: { error: "Erro ao carregar carrinho local" },
      });
    }
  };

  // Load cart when component mounts or authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // User just logged in - sync local cart with backend
      syncLocalCartWithBackend();
    } else {
      // User not authenticated - load from localStorage
      loadLocalCart();
    }
  }, [isAuthenticated, user]);

  const addItem = async (item: CartItem): Promise<void> => {
    try {
      dispatch({ type: "CART_LOADING", payload: { loading: true } });

      if (isAuthenticated) {
        // User is authenticated - save to backend
        const request: AddToCartRequest = {
          productId: item.productId,
          quantity: item.quantity,
        };

        const updatedCart = await CartService.addToCart(request);
        dispatch({ type: "CART_SUCCESS", payload: { cart: updatedCart } });
      } else {
        // User not authenticated - save to localStorage
        localCart.addItem(item);
        const localItems = localCart.get();
        const localCartData = createLocalCart(localItems);
        dispatch({ type: "CART_SUCCESS", payload: { cart: localCartData } });
      }

      toast.success(`${item.name} adicionado ao carrinho!`);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      const errorMessage = parseApiError(error as any).message;
      dispatch({ type: "CART_ERROR", payload: { error: errorMessage } });
      toast.error(`Erro ao adicionar ${item.name} ao carrinho.`);
    }
  };

  const removeItem = async (itemId: string): Promise<void> => {
    try {
      dispatch({ type: "CART_LOADING", payload: { loading: true } });

      if (isAuthenticated) {
        // User is authenticated - remove from backend
        const updatedCart = await CartService.removeFromCart(itemId);
        dispatch({ type: "CART_SUCCESS", payload: { cart: updatedCart } });
      } else {
        // User not authenticated - remove from localStorage
        localCart.removeItem(itemId);
        const localItems = localCart.get();
        const localCartData = createLocalCart(localItems);
        dispatch({ type: "CART_SUCCESS", payload: { cart: localCartData } });
      }

      toast.success("Item removido do carrinho!");
    } catch (error) {
      console.error("Failed to remove item from cart:", error);
      const errorMessage = parseApiError(error as any).message;
      dispatch({ type: "CART_ERROR", payload: { error: errorMessage } });
      toast.error("Erro ao remover item do carrinho.");
    }
  };

  const updateQuantity = async (
    itemId: string,
    quantity: number
  ): Promise<void> => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      dispatch({ type: "CART_LOADING", payload: { loading: true } });

      if (isAuthenticated) {
        // User is authenticated - update in backend
        const updatedCart = await CartService.updateCartItem(itemId, {
          quantity,
        });
        dispatch({ type: "CART_SUCCESS", payload: { cart: updatedCart } });
      } else {
        // User not authenticated - update in localStorage
        localCart.updateQuantity(itemId, quantity);
        const localItems = localCart.get();
        const localCartData = createLocalCart(localItems);
        dispatch({ type: "CART_SUCCESS", payload: { cart: localCartData } });
      }
    } catch (error) {
      console.error("Failed to update cart item:", error);
      const errorMessage = parseApiError(error as any).message;
      dispatch({ type: "CART_ERROR", payload: { error: errorMessage } });
      toast.error("Erro ao atualizar quantidade do item.");
    }
  };

  const clearCart = async (): Promise<void> => {
    try {
      dispatch({ type: "CART_LOADING", payload: { loading: true } });

      if (isAuthenticated) {
        // User is authenticated - clear from backend
        await CartService.clearCart();
        const emptyCart: Cart = {
          id: "",
          userId: user?.id || "",
          items: [],
          totalItems: 0,
          totalAmount: 0,
          createdAt: "",
          updatedAt: "",
        };
        dispatch({ type: "CART_SUCCESS", payload: { cart: emptyCart } });
      } else {
        // User not authenticated - clear localStorage
        localCart.clear();
        const emptyCart = createLocalCart([]);
        dispatch({ type: "CART_SUCCESS", payload: { cart: emptyCart } });
      }

      toast.success("Carrinho limpo!");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      const errorMessage = parseApiError(error as any).message;
      dispatch({ type: "CART_ERROR", payload: { error: errorMessage } });
      toast.error("Erro ao limpar carrinho.");
    }
  };

  const refreshCart = async (): Promise<void> => {
    if (isAuthenticated) {
      await loadBackendCart();
    } else {
      loadLocalCart();
    }
  };

  // Derived values
  const items = state.cart ? convertToUIItems(state.cart.items) : [];
  const total = state.cart?.totalAmount || 0;
  const totalItems = state.cart?.totalItems || 0;

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading: state.isLoading,
        error: state.error,
        total,
        totalItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
