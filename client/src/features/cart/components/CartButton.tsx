import { useState, useEffect } from "react";
import { useCart } from "../../../contexts/CartContext";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  return (
    <>
      <button
        className="flex items-center gap-1.5 relative text-slate-600 hover:text-emerald-600 cursor-pointer transition-colors"
        onClick={() => setOpen(true)}
      >
        <svg
          className={`w-5 h-5 ${animate ? "scale-125 text-emerald-600 transition-transform duration-150" : "transition-transform duration-300"}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-sm font-semibold">Carrito</span>
        {totalItems > 0 && (
          <span className={`absolute -top-2 left-2 bg-emerald-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm ${animate ? "animate-pulse" : ""}`}>
            {totalItems}
          </span>
        )}
      </button>
      {open && <CartDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
