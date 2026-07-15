import { useState } from "react";
import type { Product } from "../../../shared/types";
import { useCart as useCartContext } from "../../../contexts/CartContext";
import { Star, Shield, Truck, RotateCcw, X, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { CURRENCY_FORMAT } from "../../../shared/constants";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { items, addItem, updateQuantity } = useCartContext();
  const inCartItem = items.find((i) => i.product.id === product.id);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(product.price);

  const handleAdd = async () => {
    if (product.stock === 0) return;
    setAdding(true);
    try {
      if (inCartItem) {
        // Si ya está, le sumamos la cantidad seleccionada
        await updateQuantity(product.id, quantity);
      } else {
        // Si no está, agregamos 1 y luego actualizamos la diferencia
        await addItem(product);
        if (quantity > 1) {
          await updateQuantity(product.id, quantity - 1);
        }
      }
      onClose();
    } catch (err) {
      console.error("[ProductModal] Error adding item to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  const placeholderSrc = `https://placehold.co/400x400/1e293b/94a3b8?text=${encodeURIComponent(product.name.charAt(0))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300">
      <div 
        className="absolute inset-0 cursor-default" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scale-in max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/40 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {/* Imagen del Producto */}
        <div className="md:w-1/2 aspect-square relative bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5">
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <img
            src={imgError || !product.image ? placeholderSrc : product.image}
            alt={product.name}
            className="max-w-[90%] max-h-[90%] object-contain rounded-2xl transition duration-500 hover:scale-105"
            onError={() => setImgError(true)}
          />
        </div>

        {/* Detalles del Producto */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Categoría */}
            <span className="inline-flex text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {product.category}
            </span>

            {/* Nombre */}
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
              {product.name}
            </h2>

            {/* Valoración */}
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < 4 ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-300">4.8</span>
              <span className="text-xs text-slate-500 font-medium">(42 opiniones de clientes)</span>
            </div>

            {/* Precio */}
            <p className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {formattedPrice}
            </p>

            <hr className="border-white/5" />

            {/* Garantías y Ventajas */}
            <div className="space-y-2.5 text-xs text-slate-400 font-sans">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-indigo-400 shrink-0" />
                <span>Garantía oficial Nexus de 12 meses.</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-emerald-400 shrink-0" />
                <span>Envío express asegurado (recíbelo en 48 horas).</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-cyan-400 shrink-0" />
                <span>Devoluciones gratis durante los primeros 30 días.</span>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Estado del Stock */}
            <div className="text-xs">
              {product.stock === 0 ? (
                <span className="font-semibold text-rose-400">Sin stock disponible</span>
              ) : product.stock <= 5 ? (
                <span className="font-semibold text-amber-400">¡Solo quedan {product.stock} unidades disponibles!</span>
              ) : (
                <span className="text-slate-400 font-medium">Stock disponible: <strong className="text-slate-200">{product.stock}</strong> unidades</span>
              )}
            </div>
          </div>

          {/* Acciones de Compra */}
          <div className="mt-8 space-y-4">
            {product.stock > 0 && (
              <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-2xl max-w-[140px]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {product.stock === 0 ? (
              <button
                disabled
                className="w-full py-3.5 rounded-xl font-bold bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed text-center text-sm transition"
              >
                Producto Agotado
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={adding}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none ${
                  inCartItem
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/20"
                    : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:shadow-indigo-500/20"
                }`}
              >
                {adding ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Añadiendo...
                  </>
                ) : inCartItem ? (
                  <>
                    <Check size={16} />
                    {quantity > 1 ? "Agregar más al carrito" : "Agregar otro"}
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Añadir al Carrito
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
