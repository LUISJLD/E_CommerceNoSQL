import { useCart } from "../../../contexts/CartContext";
import { useEffect, useState } from "react";

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, totalItems, cacheSource, responseTime, removeItem, checkout } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [address, setAddress] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!address.trim()) {
      alert("Por favor ingresa una dirección de envío válida.");
      return;
    }
    setIsCheckingOut(true);
    const success = await checkout(address);
    setIsCheckingOut(false);
    if (success) {
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        onClose();
      }, 2000);
    } else {
      alert("Error al procesar el pedido.");
    }
  };

  const sourceBadgeClass =
    cacheSource === "CACHE"
      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
      : cacheSource === "DATABASE"
      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
      : "bg-slate-500/10 text-slate-500 border border-slate-500/20";

  const sourceLabel =
    cacheSource === "CACHE"
      ? "⚡ Redis Cache"
      : cacheSource === "DATABASE"
      ? "🗄️ DynamoDB"
      : "— Sin datos";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">

        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-800 to-indigo-500 bg-clip-text text-transparent">
            Tu Carrito
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Cerrar carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 bg-white flex items-center justify-between border-b border-slate-100 shadow-sm z-10">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sourceBadgeClass}`}>
            {sourceLabel}
          </span>
          {responseTime > 0 && (
            <span className="text-xs font-medium text-slate-400 font-mono">
              ⏱ {responseTime} ms
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {checkoutSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">¡Pedido Confirmado!</h3>
              <p className="text-slate-500 mt-2 text-sm font-medium">Tu orden ha sido guardada con éxito.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <svg className="w-20 h-20 mb-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-lg font-medium text-slate-500">Tu carrito está vacío</p>
              <p className="text-xs mt-2">¡Agrega algunos productos para continuar!</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">{item.product.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.quantity} × <span className="font-medium text-indigo-500">${item.product.price.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      aria-label={`Eliminar ${item.product.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <p className="font-bold text-slate-800 text-base">
                      ${(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && !checkoutSuccess && (
          <div className="border-t border-slate-200 bg-white p-6 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.08)] relative z-10">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">Subtotal ({totalItems} items)</p>
                <p className="text-xl font-bold text-slate-800">${totalPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="address" className="block text-xs font-semibold text-slate-600 mb-1">
                Dirección de Envío
              </label>
              <input
                type="text"
                id="address"
                placeholder="Ej. Calle 123 #45-67"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-base
                ${isCheckingOut
                  ? "bg-indigo-400 cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
                }`}
            >
              {isCheckingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando Pedido...
                </>
              ) : (
                <>
                  Proceder al Pago
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
