import { useCart } from "../../../contexts/CartContext";
import { useEffect } from "react";
import { CURRENCY_FORMAT } from "../../../shared/constants";

interface CartDrawerProps {
  onClose: () => void;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(value);
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, totalItems, cacheSource, responseTime, addItem, removeItem, clear } = useCart();

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

  const sourceBadgeClass =
    cacheSource === "CACHE"
      ? "bg-green-100 text-green-800 border border-green-300"
      : cacheSource === "DATABASE"
      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
      : "bg-gray-100 text-gray-500 border border-gray-300";

  const sourceLabel =
    cacheSource === "CACHE"
      ? "⚡ Redis Cache"
      : cacheSource === "DATABASE"
      ? "🗄️ DynamoDB"
      : "— Sin datos";

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end z-50">
      <div className="w-96 h-full bg-white shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <i className="bi bi-cart3 text-teal-600"></i>
            <h2 className="text-base font-semibold text-gray-900">Carrito</h2>
            {totalItems > 0 && (
              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Badge de caché */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceBadgeClass}`}>
            {sourceLabel}
          </span>
          {responseTime > 0 && (
            <span className="text-xs text-gray-400">{responseTime} ms</span>
          )}
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <i className="bi bi-cart-x text-xl text-gray-400"></i>
              </div>
              <p className="text-sm font-medium text-gray-500">Tu carrito está vacío</p>
              <p className="text-xs text-gray-400 mt-1">Agrega productos desde la tienda</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  {/* Imagen mini */}
                  <img
                    src={item.product.image || `https://placehold.co/48x48/e2e8f0/64748b?text=${item.product.name.charAt(0)}`}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-200 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/48x48/e2e8f0/64748b?text=${item.product.name.charAt(0)}`;
                    }}
                  />

                  {/* Info + controles */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatPrice(item.product.price)} c/u</p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-l-lg transition-colors cursor-pointer text-sm"
                          aria-label="Quitar uno"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addItem(item.product)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-r-lg transition-colors cursor-pointer text-sm"
                          aria-label="Agregar uno"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer con total y acciones */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Subtotal ({totalItems} items)</span>
              <span className="text-base font-bold text-gray-900">{formatPrice(totalPrice)}</span>
            </div>

            <button
              className="w-full bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="bi bi-bag-check"></i>
              Proceder al pago
            </button>

            <button
              onClick={clear}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer py-1"
            >
              <i className="bi bi-trash3 mr-1"></i>Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
