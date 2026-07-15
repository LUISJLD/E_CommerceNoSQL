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
  updateQuantity: (productId: string, delta: number) => Promise<void>;
  clear: () => void;
  refreshCart: () => Promise<void>;
  checkout: (address: string) => Promise<boolean>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
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
  const [isCartOpen, setIsCartOpen] = useState(false);
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
      const response = await fetch(`${API_URL}/cart/${encodeURIComponent(userId)}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        console.error("[Cart] GET error:", response.status, response.statusText);
        return;
      }

      const result = await response.json();
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);

      // La fuente correcta siempre viene en el body (cache_aside la incluye)
      // El header X-Cache-Source no es confiable a través de API Gateway / LocalStack
      const backendSource: "CACHE" | "DATABASE" | "UNKNOWN" =
        result.source === "CACHE" ? "CACHE"
        : result.source === "DATABASE" ? "DATABASE"
        : "UNKNOWN";
      const backendData: Array<{ productId: string; qty: number; price: number }> =
        Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);

      setCacheSource(backendSource);

      // Enriquecer con datos del catálogo si están disponibles
      const catalogMap = new Map(catalogRef.current.map((p) => [p.id, p]));

      const mappedItems: CartItem[] = backendData.map((item) => {
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
      console.log(`[Cart] ${backendSource} | ${elapsed}ms | ${backendData.length} items`);
    } catch (err) {
      console.error("[Cart] refreshCart error:", err);
    }
  }, [userId]);

  const addItem = useCallback(async (product: Product) => {
    // 1. Dispatch optimista: UI se actualiza al instante
    dispatch({ type: "ADD_ITEM", payload: product });

    // 2. La llamada al backend es fire-and-forget — no bloquea la tarjeta
    const token = localStorage.getItem('ecommerce_token');
    fetch(`${API_URL}/cart/${encodeURIComponent(userId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ productId: product.id, qty: 1, price: product.price }),
    }).then((response) => {
      if (!response.ok) {
        // Revertir en background si falla
        dispatch({ type: "REMOVE_ITEM", payload: product.id });
        console.error("[Cart] POST error:", response.status);
      }
    }).catch((err) => {
      dispatch({ type: "REMOVE_ITEM", payload: product.id });
      console.error("[Cart] addItem error:", err);
    });
    // La promesa resuelve inmediatamente → ProductCard sale de loading al instante
  }, [userId]);

  const removeItem = useCallback(async (productId: string) => {
    // Guardar snapshot para revertir si falla
    const snapshot = state.items;
    dispatch({ type: "REMOVE_ITEM", payload: productId });
    try {
      const token = localStorage.getItem('ecommerce_token');
      const response = await fetch(
        `${API_URL}/cart/${encodeURIComponent(userId)}?productId=${encodeURIComponent(productId)}`,
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

  const updateQuantity = useCallback(async (productId: string, delta: number) => {
    const existing = state.items.find((i) => i.product.id === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      await removeItem(productId);
      return;
    }

    // Actualización optimista
    dispatch({
      type: "SET_ITEMS",
      payload: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      ),
    });

    try {
      const token = localStorage.getItem('ecommerce_token');
      const response = await fetch(`${API_URL}/cart/${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ productId, qty: delta, price: existing.product.price }),
      });

      if (!response.ok) {
        await refreshCart();
      }
    } catch (err) {
      await refreshCart();
      console.error("[Cart] updateQuantity error:", err);
    }
  }, [userId, state.items, removeItem, refreshCart]);

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const checkout = useCallback(async (_address: string): Promise<boolean> => {
    try {
      // Importación dinámica para evitar problemas de ciclo o usar el servicio de forma limpia
      const { createOrder } = await import("../services/orders.service");
      await createOrder(userId);
      clear();
      await refreshCart();
      return true;
    } catch (err) {
      console.error("[Cart] Checkout error:", err);
      return false;
    }
  }, [userId, clear, refreshCart]);

  // Carga inicial y recarga si cambia el usuario
  useEffect(() => {
    refreshCart();

    // Sincronizar carrito anónimo al iniciar sesión
    if (userId && userId !== "guest") {
      const anonCartStr = localStorage.getItem("anonymous_cart");
      if (anonCartStr) {
        try {
          const anonItems = JSON.parse(anonCartStr);
          if (Array.isArray(anonItems) && anonItems.length > 0) {
            const token = localStorage.getItem('ecommerce_token');
            (async () => {
              for (const item of anonItems) {
                try {
                  await fetch(`${API_URL}/cart/${encodeURIComponent(userId)}`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                      productId: item.id || item.product?.id,
                      qty: item.quantity,
                      price: item.price || item.product?.price,
                    }),
                  });
                } catch (err) {
                  console.error("Failed to sync item:", item, err);
                }
              }
            })().then(() => {
              localStorage.removeItem("anonymous_cart");
              refreshCart();
            });
          }
        } catch (e) {
          console.error("Error syncing anonymous cart:", e);
        }
      }
    }
  }, [userId, refreshCart]);

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
        updateQuantity,
        clear,
        refreshCart,
        checkout,
        isCartOpen,
        setIsCartOpen,
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
