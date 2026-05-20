import { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import type { Product, CartItem } from "../shared/types";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "CLEAR" };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { items: [...state.items, { product: action.payload, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((item) => item.product.id !== action.payload),
      };
    case "CLEAR":
      return { items: [] };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    totalItems,
    addItem: (product) => dispatch({ type: "ADD_ITEM", payload: product }),
    removeItem: (id) => dispatch({ type: "REMOVE_ITEM", payload: id }),
    clear: () => dispatch({ type: "CLEAR" }),
  };

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
