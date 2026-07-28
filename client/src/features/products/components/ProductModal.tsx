import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => Promise<void>;
  inCart: boolean;
  hideAction: boolean;
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  inCart,
  hideAction,
}: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Slight delay for animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      document.body.style.overflow = "unset";
      setIsVisible(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // El modal se renderizará siempre que el padre lo incluya.
  // La animación de salida se maneja cambiando `isVisible` a false, 
  // y luego el padre lo desmonta después de un timeout.

  const formattedPrice = new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(product.price);

  const stockColor =
    product.stock === 0
      ? "text-rose-500"
      : product.stock <= 5
      ? "text-orange-500 font-bold"
      : "text-emerald-500";

  const handleAddToCart = async () => {
    if (loading || product.stock === 0) return;
    setLoading(true);
    try {
      await onAddToCart(product);
    } finally {
      setLoading(false);
    }
  };

  const nameLen = product.name.length;
  const ratingMock = 4.0 + ((nameLen * 3) % 11) / 10;
  const reviewCountMock = 30 + ((nameLen * 7) % 220);
  const fullStarsMock = Math.floor(ratingMock);
  const starsMock = "★".repeat(fullStarsMock) + "☆".repeat(5 - fullStarsMock);

  const placeholderSrc = `https://placehold.co/400x400/f8fafc/94a3b8?text=${encodeURIComponent(
    product.name.charAt(0)
  )}`;

  // Simulated descriptions based on category
  const descriptions: Record<string, string> = {
    "Electrónica": "Lleva tu experiencia tecnológica al siguiente nivel con este dispositivo premium. Equipado con la última generación de componentes para asegurar el máximo rendimiento, autonomía y diseño innovador. Perfecto para integrar a tu ecosistema inteligente.",
    "Ropa": "Confeccionado con materiales de primera calidad, esta prenda combina estilo minimalista y máxima comodidad. Su diseño versátil la convierte en la pieza clave para cualquier ocasión, adaptándose a las tendencias actuales de la moda urbana.",
    "Deportes": "Diseñado para superar tus límites. Este artículo cuenta con ergonomía avanzada y materiales de alta resistencia, ideales para actividades de alto impacto o aventuras al aire libre. Rendimiento y durabilidad garantizados.",
    "Hogar": "Transforma tu espacio con este artículo elegante y funcional. Diseñado bajo los estándares del interiorismo moderno, aporta calidez, practicidad y un toque distintivo a cualquier ambiente de tu casa.",
    "Libros": "Sumérgete en esta fascinante obra literaria, encuadernada con acabados de primera. Una lectura imprescindible que enriquecerá tu perspectiva y te brindará horas de inmersión total.",
  };

  const desc = descriptions[product.category] || "Un producto excepcional diseñado con los más altos estándares de calidad, pensado para satisfacer tus necesidades diarias con estilo y durabilidad.";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-5xl bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 transform ${
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Botón Cerrar (Mobile flotante) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden z-10 bg-white/80 backdrop-blur w-10 h-10 rounded-full flex items-center justify-center text-slate-600 border border-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Imagen Section */}
        <div className="w-full md:w-1/2 h-[300px] md:h-auto bg-slate-50 flex items-center justify-center p-8 relative group border-b md:border-b-0 md:border-r border-slate-100">
          <span className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full bg-white border border-slate-100 text-slate-500 shadow-sm z-10">
            {product.category}
          </span>
          <img
            src={product.image || placeholderSrc}
            alt={product.name}
            className="w-full h-full object-contain max-h-[350px] md:max-h-[500px] group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholderSrc;
            }}
          />
        </div>

        {/* Info Section */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col text-left bg-white">
          {/* Botón Cerrar Desktop */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors w-10 h-10 items-center justify-center bg-slate-50 rounded-full cursor-pointer hover:bg-slate-100 border border-slate-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 self-start px-3 py-1 rounded-full border border-emerald-100 mt-2 md:mt-0">
            <span>Envío Gratis</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-light text-slate-900 tracking-tight leading-tight mb-4">
            {product.name}
          </h2>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-emerald-500 text-sm tracking-tighter">{starsMock}</span>
            <span className="text-xs font-bold text-slate-700">{ratingMock.toFixed(1)}</span>
            <span className="text-slate-300 text-xs px-1">|</span>
            <span className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-slate-800 transition-colors">
              Leer {reviewCountMock} reseñas
            </span>
          </div>

          <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
            {desc}
          </p>

          <div className="mt-auto">
            <div className="flex items-end justify-between mb-6 border-t border-slate-100 pt-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Precio Final</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{formattedPrice}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Disponibilidad</p>
                <p className={`text-xs font-black uppercase tracking-wider ${stockColor}`}>
                  {product.stock === 0
                    ? "Agotado"
                    : product.stock <= 5
                    ? `¡Últimas ${product.stock}!`
                    : `Stock: ${product.stock} unidades`}
                </p>
              </div>
            </div>

            {/* Actions */}
            {!hideAction && (
              <div className="flex gap-4">
                {product.stock === 0 ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-4 rounded-full text-xs font-bold tracking-widest uppercase cursor-not-allowed border border-slate-200"
                  >
                    Producto Agotado
                  </button>
                ) : inCart ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-4 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="animate-pulse">Agregando...</span>
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[12px] font-black leading-none pb-0.5">+</span>
                        Agregar otra unidad
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-80"
                  >
                    {loading ? (
                      <span className="animate-pulse">Procesando...</span>
                    ) : (
                      "Añadir al Carrito"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
