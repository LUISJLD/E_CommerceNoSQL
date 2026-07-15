import { useEffect, useState } from "react";
import { useCart } from "../../../contexts/CartContext";

export default function CartButton() {
  const { totalItems, setIsCartOpen } = useCart();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (totalItems === 0) return;
    setBump(true);
    const timer = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(timer);
  }, [totalItems]);

  return (
    <button
      className="flex items-center gap-1.5 relative text-slate-300 hover:text-white cursor-pointer select-none"
      onClick={() => setIsCartOpen(true)}
    >
      <i className={`bi bi-cart-fill text-base transition-all duration-300 ${
        bump ? "-translate-y-0.5 scale-110 text-indigo-400" : ""
      }`}></i>
      <span className="text-sm font-semibold">Carrito</span>
      {totalItems > 0 && (
        <span className={`absolute -top-2 left-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 transition-all duration-300 ${
          bump ? "scale-125 shadow-indigo-400/40" : "scale-100"
        }`}>
          {totalItems}
        </span>
      )}
    </button>
  );
}
