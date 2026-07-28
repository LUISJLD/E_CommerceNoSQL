import { useCart } from "../../../contexts/CartContext";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, totalItems, cacheSource, responseTime, removeItem, checkout } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const [isClosing, setIsClosing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoadingAddresses(true);
      const token = localStorage.getItem('ecommerce_token');
      fetch(`${API_URL}/users/${encodeURIComponent(user.email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          setAddress(data.addresses[0]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingAddresses(false));
    }
  }, [isAuthenticated, user, API_URL]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400); // Wait for animations to complete
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      handleClose();
      navigate("/login?mode=login");
      return;
    }
    if (!address.trim()) {
      alert("Por favor ingresa una dirección de envío válida.");
      return;
    }
    setIsCheckingOut(true);
    try {
      const success = await checkout(address);
      if (success) {
        setCheckoutSuccess(true);
        setTimeout(() => {
          setCheckoutSuccess(false);
          handleClose();
        }, 2200);
      }
    } catch (err: any) {
      alert(err.message || "Error al procesar el pedido.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cacheBadgeClass =
    cacheSource === "CACHE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : cacheSource === "DATABASE"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-slate-100 text-slate-400 border-slate-200";

  const cacheLabel =
    cacheSource === "CACHE"
      ? "⚡ Redis Cache"
      : cacheSource === "DATABASE"
      ? "🍃 MongoDB Atlas"
      : null;

  return createPortal(
    /*
     * Root overlay — fixed, full viewport.
     * `items-stretch` on the flex parent so the panel can fill the full height.
     */
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-all ${
          isClosing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full max-w-md h-[100dvh] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-100 ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >

        {/* ── 1. Header (never scrolls) ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">
              Tu Carrito
            </h2>
            {totalItems > 0 && (
              <p className="text-xs text-slate-400 font-light mt-0.5">
                {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── 2. Cache badge strip (never scrolls) ── */}
        {cacheLabel && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-100">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cacheBadgeClass}`}
            >
              {cacheLabel}
            </span>
            {responseTime > 0 && (
              <span className="text-[10px] text-slate-400">{responseTime} ms</span>
            )}
          </div>
        )}

        {/* ── 3. Scrollable items area ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {checkoutSuccess ? (
            /* Success state */
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">¡Pedido Confirmado!</h3>
                <p className="text-sm text-slate-400 font-light mt-1">
                  Tu orden ha sido guardada con éxito.
                </p>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center text-center gap-3">
              <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm font-medium text-slate-500">Tu carrito está vacío</p>
              <p className="text-xs text-slate-400 font-light">Agrega productos para continuar</p>
            </div>
          ) : (
            /* Item list */
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-light mt-1">
                      {item.quantity} ×{" "}
                      <span className="text-emerald-600 font-medium">
                        ${item.product.price.toLocaleString()}
                      </span>
                    </p>
                  </div>
                  {/* Subtotal + remove */}
                  <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                      aria-label={`Eliminar ${item.product.name}`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <p className="text-sm font-bold text-slate-900">
                      ${(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 4. Footer — pinned to bottom, never scrolls ── */}
        {items.length > 0 && !checkoutSuccess && (
          <div className="flex-shrink-0 border-t border-slate-100 bg-white p-6 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            {/* Subtotal row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Subtotal ({totalItems} art.)
              </span>
              <span className="text-xl font-bold text-slate-900">
                ${totalPrice.toLocaleString()}
              </span>
            </div>

            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                {/* Shipping address input */}
                <div>
                  <label
                    htmlFor="cart-address"
                    className="block text-xs font-medium text-slate-500 mb-1.5"
                  >
                    Dirección de Envío
                  </label>
                  {isLoadingAddresses ? (
                    <p className="text-xs text-slate-400 py-2">Cargando direcciones...</p>
                  ) : savedAddresses.length > 0 ? (
                    <select
                      id="cart-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Selecciona una dirección</option>
                      {savedAddresses.map((addr, idx) => (
                        <option key={idx} value={addr}>{addr.substring(0, 50)}{addr.length > 50 ? '...' : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
                      Debes agregar una dirección en tu perfil antes de comprar.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || savedAddresses.length === 0}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar Compra
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-emerald-600 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Iniciar Sesión para Pagar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <p className="text-[10px] text-center text-slate-400 font-light">
                  Inicia sesión para finalizar tu compra.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
