import { useCart } from "../../../contexts/CartContext";
import { useEffect } from "react";

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, totalItems, cacheSource, responseTime, removeItem } = useCart();

  // Cerrar con Escape
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

  // Colores del badge según la fuente de datos
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
      <div className="w-96 h-full bg-white shadow-lg p-4 overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Carrito</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Badge de caché — muestra si los datos vienen de Redis o DynamoDB */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceBadgeClass}`}
          >
            {sourceLabel}
          </span>
          {responseTime > 0 && (
            <span className="text-xs text-gray-400">{responseTime} ms</span>
          )}
        </div>

        {/* Lista de productos */}
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">El carrito está vacío.</p>
        ) : (
          <ul className="space-y-3 flex-1">
            {items.map((item) => (
              <li
                key={item.product.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × ${item.product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-sm">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                    aria-label={`Eliminar ${item.product.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Total */}
        {items.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <p className="flex justify-between font-semibold text-sm">
              <span>Total ({totalItems} items)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
