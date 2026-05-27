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
      const response = await fetch(`${API_URL}/cart/${userId}`);

      if (!response.ok) {
        console.error("[Cart] GET error:", response.status, response.statusText);
        return;
      }

      const source = response.headers.get("X-Cache-Source");
      setCacheSource(source === "CACHE" ? "CACHE" : source === "DATABASE" ? "DATABASE" : "UNKNOWN");
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);

      const result = await response.json();

      const backendItems: Array<{ productId: string; qty: number; price: number }> =
        Array.isArray(result) ? result : [];

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
      console.log(`[Cart] ${result.source} | ${elapsed}ms | ${backendItems.length} items`);
    } catch (err) {
      console.error("[Cart] refreshCart error:", err);
    }
  }, [userId]); // <-- userId como dependencia, no loadCart

  const addItem = useCallback(async (product: Product) => {
    try {
      console.log("[Cart] POST", product.id, "→", userId);
      const response = await fetch(`${API_URL}/cart/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, qty: 1, price: product.price }),
      });

      if (!response.ok) {
        console.error("[Cart] POST error:", response.status, response.statusText);
        return;
      }

      await refreshCart();
    } catch (err) {
      console.error("[Cart] addItem error:", err);
    }
  }, [userId, refreshCart]);

  const removeItem = useCallback(async (productId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/cart/${userId}?productId=${productId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        console.error("[Cart] DELETE error:", response.status, response.statusText);
        return;
      }

      await refreshCart();
    } catch (err) {
      console.error("[Cart] removeItem error:", err);
    }
  }, [userId, refreshCart]);

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

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
