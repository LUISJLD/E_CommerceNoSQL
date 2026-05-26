import { useCart } from "../../../contexts/CartContext";
import { useEffect } from "react";

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, totalItems } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Removed conditional early return; parent controls visibility
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);


  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end z-50">
      <div className="w-96 h-full bg-white shadow-lg p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Carrito</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            ✕
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-gray-500">El carrito está vacío.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.product.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x ${item.product.price}
                  </p>
                </div>
                <p className="font-medium">${item.product.price * item.quantity}</p>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <p className="flex justify-between font-semibold">
              <span>Total ({totalItems} items)</span>
              <span>${totalPrice}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
