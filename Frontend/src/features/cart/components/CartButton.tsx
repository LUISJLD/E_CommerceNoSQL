import { useState } from "react";
import { useCart } from "../../../contexts/CartContext";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex items-center gap-1.5 relative text-gray-800 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <i className="bi bi-cart-fill text-base"></i>
        <span className="text-sm font-medium">Carrito</span>
        {totalItems > 0 && (
          <span className="absolute -top-2 left-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {totalItems}
          </span>
        )}
      </button>
      {open && <CartDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
