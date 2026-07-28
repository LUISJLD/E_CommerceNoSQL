import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import type { ReactNode } from "react";
import type { Product, CartItem } from "../shared/types";

// Formatea un productId como nombre legible si no hay catálogo disponible
// ej: "laptop-wp15" → "Laptop Wp15"
function formatProductId(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* =========================================================
   TYPES
========================================================= */

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "CLEAR" }
  | { type: "SET_ITEMS"; payload: CartItem[] };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  cacheSource: "CACHE" | "DATABASE" | "UNKNOWN";
  responseTime: number;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => void;
  refreshCart: () => Promise<void>;
  checkout: (address: string) => Promise<boolean>;
}

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL || "/api";

/* =========================================================
   CONTEXT
========================================================= */

const CartContext = createContext<CartContextValue | null>(null);

/* =========================================================
   REDUCER
========================================================= */

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.product.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.payload, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.product.id !== action.payload) };
    case "CLEAR":
      return { items: [] };
    case "SET_ITEMS":
      return { items: action.payload };
    default:
      return state;
  }
}

/* =========================================================
   PROVIDER
========================================================= */

export function CartProvider({
  children,
  userId,
  catalog = [],
}: {
  children: ReactNode;
  userId: string;
  catalog?: Product[];
}) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [cacheSource, setCacheSource] = useState<"CACHE" | "DATABASE" | "UNKNOWN">("UNKNOWN");
  const [responseTime, setResponseTime] = useState(0);

  // Ref para el catálogo — se actualiza sin recrear refreshCart
  const catalogRef = useRef<Product[]>(catalog);
  useEffect(() => { catalogRef.current = catalog; }, [catalog]);

  // refreshCart no recibe parámetros — siempre usa el userId de la prop.
  // userId está en las dependencias para que se recree si cambia el usuario.
  const refreshCart = useCallback(async () => {
    try {
      const start = performance.now();
      const token = localStorage.getItem('ecommerce_token');
      const response = await fetch(`${API_URL}/cart/${userId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        console.error("[Cart] GET error:", response.status, response.statusText);
        return;
      }

      const source = response.headers.get("X-Cache-Source");
      setCacheSource(source === "CACHE" ? "CACHE" : source === "DATABASE" ? "DATABASE" : "UNKNOWN");
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);

      const result = await response.json();

      const backendSource = result.source || "UNKNOWN";
      const backendData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);

      setCacheSource(backendSource);

      const backendItems: Array<{ productId: string; qty: number; price: number }> = backendData;

      // Enriquecer con datos del catálogo si están disponibles
      const catalogMap = new Map(catalogRef.current.map((p) => [p.id, p]));

      const mappedItems: CartItem[] = backendItems.map((item) => {
        const catalogProduct = catalogMap.get(item.productId);
        return {
          product: catalogProduct ?? {
            id: item.productId,
            name: formatProductId(item.productId),
            category: "",
            image: "",
            price: Number(item.price),
            stock: 99,
          },
          quantity: Number(item.qty),
        };
      });

      dispatch({ type: "SET_ITEMS", payload: mappedItems });
      console.log(`[Cart] ${backendSource} | ${elapsed}ms | ${backendItems.length} items`);
    } catch (err) {
      console.error("[Cart] refreshCart error:", err);
    }
  }, [userId]); // <-- userId como dependencia, no loadCart

  const addItem = useCallback(async (product: Product) => {
    // Actualización optimista: UI cambia inmediatamente
    dispatch({ type: "ADD_ITEM", payload: product });
    try {
      const token = localStorage.getItem('ecommerce_token');
      const response = await fetch(`${API_URL}/cart/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ productId: product.id, qty: 1, price: product.price }),
      });
      if (!response.ok) {
        // Revertir si falló
        dispatch({ type: "REMOVE_ITEM", payload: product.id });
        console.error("[Cart] POST error:", response.status);
      }
    } catch (err) {
      dispatch({ type: "REMOVE_ITEM", payload: product.id });
      console.error("[Cart] addItem error:", err);
    }
  }, [userId]);

  const removeItem = useCallback(async (productId: string) => {
    // Guardar snapshot para revertir si falla
    const snapshot = state.items;
    dispatch({ type: "REMOVE_ITEM", payload: productId });
    try {
      const token = localStorage.getItem('ecommerce_token');
      const response = await fetch(
        `${API_URL}/cart/${userId}?productId=${productId}`,
        {
          method: "DELETE",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        dispatch({ type: "SET_ITEMS", payload: snapshot });
        console.error("[Cart] DELETE error:", response.status);
      }
    } catch (err) {
      dispatch({ type: "SET_ITEMS", payload: snapshot });
      console.error("[Cart] removeItem error:", err);
    }
  }, [userId, state.items]);

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const checkout = useCallback(async (address: string): Promise<boolean> => {
    try {
      const { reserveInventory, createOrder } = await import("../services/orders.service");
      
      // 1. Reservar stock temporalmente
      await reserveInventory(userId);
      
      // 2. Crear orden con la dirección de envío
      await createOrder(userId, address);
      clear();
      await refreshCart();
      return true;
    } catch (err) {
      console.error("[Cart] Checkout error:", err);
      throw err; // Relanzar el error para que la UI lo atrape y muestre
    }
  }, [userId, clear, refreshCart]);

  // Carga inicial y recarga si cambia el usuario
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        cacheSource,
        responseTime,
        addItem,
        removeItem,
        clear,
        refreshCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
