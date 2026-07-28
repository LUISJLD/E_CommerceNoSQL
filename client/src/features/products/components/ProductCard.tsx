import { useState } from "react";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

const PRODUCT_BADGES: Record<string, string[]> = {
  "Electrónica": ["SMART", "5G", "NEW"],
  "Ropa": ["TREND", "PREMIUM"],
  "Deportes": ["OUTDOOR", "LIGHT"],
};

const CATEGORY_COLORS: Record<string, { badge: string, text: string }> = {
  "Electrónica": { badge: "bg-emerald-50 text-emerald-600 border-emerald-100", text: "text-emerald-700" },
  "Ropa": { badge: "bg-orange-50 text-orange-600 border-orange-100", text: "text-orange-700" },
  "Deportes": { badge: "bg-sky-50 text-sky-600 border-sky-100", text: "text-sky-700" },
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
  onClick?: (product: Product) => void;
  inCart?: boolean;
  hideAction?: boolean;
}

export default function ProductCard({ product, onAddToCart, onClick, inCart = false, hideAction = false }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(product.price);

  const stockColor =
    product.stock === 0
      ? "text-rose-500"
      : product.stock <= 5
      ? "text-orange-500 font-medium"
      : "text-slate-400";

  const styles = CATEGORY_COLORS[product.category] || { badge: "bg-slate-50 text-slate-600 border-slate-100", text: "text-slate-700" };
  const badges = PRODUCT_BADGES[product.category] || ["NEW"];

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || product.stock === 0) return;
    setLoading(true);
    try {
      await onAddToCart(product);
    } finally {
      setLoading(false);
    }
  };

  const placeholderSrc = `https://placehold.co/200x200/f8fafc/94a3b8?text=${encodeURIComponent(product.name.charAt(0))}`;

  // Generate mock rating data dynamically based on name length & product id to make it consistent
  const nameLen = product.name.length;
  const ratingMock = 4.0 + ((nameLen * 3) % 11) / 10;
  const reviewCountMock = 30 + ((nameLen * 7) % 220);
  const fullStarsMock = Math.floor(ratingMock);
  const starsMock = "★".repeat(fullStarsMock) + "☆".repeat(5 - fullStarsMock);

  return (
    <article 
      onClick={() => onClick && onClick(product)}
      className="relative bg-slate-50 border border-slate-100 rounded-[32px] p-5 flex flex-col gap-4 hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer"
    >
      
      {/* Contenedor de Imagen */}
      <div className="w-full h-48 flex items-center justify-center bg-white rounded-2xl overflow-hidden mt-2 relative shadow-sm border border-slate-50/50">
        {/* Pestaña superior flotante */}
        <div className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${styles.badge} shadow-sm z-10`}>
          {product.category}
        </div>
        
        <img
          src={imgError || !product.image ? placeholderSrc : product.image}
          alt={product.name}
          className="max-w-[85%] max-h-[85%] object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Badges técnicos */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {badges.map((badge, idx) => (
          <span
            key={idx}
            className="text-[9px] font-semibold tracking-wider uppercase bg-white border border-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full"
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Información del Producto */}
      <div className="flex-1 flex flex-col gap-1.5 text-left">
        <h3 className="text-base font-semibold text-slate-800 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Rating con estrellas */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
          <span className="text-emerald-500 text-xs tracking-tighter">{starsMock}</span>
          <span>{ratingMock.toFixed(1)}</span>
          <span className="text-slate-300">·</span>
          <span>{reviewCountMock} reseñas</span>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between">
          <p className="text-xl font-bold text-slate-900 tracking-tight">{formattedPrice}</p>
          <p className={`text-[10px] ${stockColor} uppercase tracking-wider font-medium`}>
            {product.stock === 0
              ? "Agotado"
              : product.stock <= 5
              ? `¡Solo ${product.stock}!`
              : `Stock: ${product.stock}`}
          </p>
        </div>
      </div>

      {/* Botón de compra */}
      {hideAction ? null : product.stock === 0 ? (
        <button
          disabled
          className="w-full bg-slate-100 text-slate-400 py-3 rounded-full text-xs font-semibold tracking-widest uppercase cursor-not-allowed border border-slate-200"
        >
          Agotado
        </button>
      ) : inCart ? (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-emerald-100 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">+</span>
          )}
          {loading ? "Agregando..." : "Agregar otro"}
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              Añadir al carrito
            </>
          )}
        </button>
      )}
    </article>
  );
}
