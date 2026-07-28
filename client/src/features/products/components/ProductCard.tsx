import { useState } from "react";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

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

  const nameLen = product.name.length;
  const ratingMock = 4.0 + ((nameLen * 3) % 11) / 10;
  const reviewCountMock = 30 + ((nameLen * 7) % 220);
  const fullStarsMock = Math.floor(ratingMock);

  const placeholderSrc = `https://placehold.co/300x300/f0fdf4/6ee7b7?text=${encodeURIComponent(product.name.charAt(0))}`;

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

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article
      onClick={() => onClick && onClick(product)}
      className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(0,0,0,0.10), 0 8px 16px rgba(16,185,129,0.08)";
        (e.currentTarget as HTMLElement).style.borderColor = "#10b981";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
      }}
    >
      {/* Imagen con gradiente superior */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{
          height: "210px",
          background: "linear-gradient(145deg, #f0fdf4 0%, #f8fafc 60%, #ecfdf5 100%)",
        }}
      >
        {/* Categoría — badge limpio */}
        <span className="absolute top-3 left-3 z-10 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-slate-500 backdrop-blur-sm shadow-sm">
          {product.category}
        </span>

        {/* Stock bajo */}
        {isLowStock && (
          <span className="absolute top-3 right-3 z-10 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-rose-500 text-white shadow-sm">
            ¡Solo {product.stock}!
          </span>
        )}

        {/* Hover overlay sutil */}
        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-300" />

        <img
          src={imgError || !product.image ? placeholderSrc : product.image}
          alt={product.name}
          className="max-w-[76%] max-h-[76%] object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Nombre */}
        <h3 className="text-sm font-semibold text-slate-800 leading-[1.4] line-clamp-2 min-h-[40px]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${i < fullStarsMock ? "text-emerald-500" : "text-slate-200"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {ratingMock.toFixed(1)}
            <span className="mx-1 text-slate-200">·</span>
            {reviewCountMock} reseñas
          </span>
        </div>

        {/* Precio — altura fija para que todos los botones queden alineados */}
        <div className="pt-3 min-h-[52px]" style={{ borderTop: "1px solid #f1f5f9" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                {formattedPrice}
              </p>
              {isLowStock && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">Últimas unidades</p>
              )}
              {isOutOfStock && (
                <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">Agotado</p>
              )}
            </div>
            {/* Indicador de carrito */}
            {inCart && !isOutOfStock && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg">
                ✓ En carrito
              </span>
            )}
          </div>
        </div>

        {/* Botón — siempre esmeralda */}
        {!hideAction && (
          isOutOfStock ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              Agotado
            </button>
          ) : (
            <button
              onClick={handleClick}
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95 ${
                inCart
                  ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              style={!inCart ? { boxShadow: "0 4px 12px rgba(16,185,129,0.3)" } : {}}
            >
              {loading ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : inCart ? "＋ Agregar otro" : "Añadir al carrito"}
            </button>
          )
        )}
      </div>
    </article>
  );
}
