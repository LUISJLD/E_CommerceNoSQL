import { useState } from "react";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

const CATEGORY_STYLES: Record<string, string> = {
  "Electrónica": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "Ropa":        "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  "Deportes":    "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  "Hogar":       "bg-green-500/10 text-green-400 border border-green-500/20",
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
  onOpenModal: (product: Product) => void;
  inCart?: boolean;
  hideAction?: boolean;
}

export default function ProductCard({ product, onAddToCart, onOpenModal, inCart = false, hideAction = false }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(product.price);

  const stockColor =
    product.stock === 0
      ? "text-rose-400 font-semibold"
      : product.stock <= 5
      ? "text-amber-400 font-semibold"
      : "text-slate-400";

  const categoryStyle = CATEGORY_STYLES[product.category] ?? "bg-slate-500/10 text-slate-400 border border-slate-500/20";

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

  const placeholderSrc = `https://placehold.co/200x200/1e293b/94a3b8?text=${encodeURIComponent(product.name.charAt(0))}`;

  return (
    <article 
      onClick={() => onOpenModal(product)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-indigo-400/40 hover:bg-white/10 flex flex-col gap-3 cursor-pointer"
    >
      {/* Glow Hover Effect */}
      <div
        className="pointer-events-none absolute -inset-24 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.15), transparent 60%)" }}
      />

      {/* Imagen */}
      <div className="relative aspect-square w-full rounded-xl bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-transparent flex items-center justify-center overflow-hidden h-36 z-10">
        <img
          src={imgError || !product.image ? placeholderSrc : product.image}
          alt={product.name}
          className="max-w-[85%] max-h-[85%] object-contain transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-1.5 z-10">
        {/* Badge de categoría */}
        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle}`}>
          {product.category}
        </span>

        <h3 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2 h-10">
          {product.name}
        </h3>

        <p className="text-base font-bold text-white mt-auto">{formattedPrice}</p>

        <p className={`text-[11px] ${stockColor}`}>
          {product.stock === 0
            ? "Sin stock"
            : product.stock <= 5
            ? `¡Solo ${product.stock} disponibles!`
            : `Stock: ${product.stock}`}
        </p>
      </div>

      {/* Botón */}
      {hideAction ? null : product.stock === 0 ? (
        <button
          disabled
          className="relative w-full rounded-full bg-white/5 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed border border-white/5 z-10"
        >
          Sin stock
        </button>
      ) : inCart ? (
        <button
          onClick={handleClick}
          disabled={loading}
          className="relative w-full rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 cursor-pointer disabled:opacity-60 z-10"
        >
          {loading ? (
            <i className="bi bi-arrow-repeat animate-spin mr-1.5"></i>
          ) : (
            <i className="bi bi-check-circle mr-1.5 text-emerald-400"></i>
          )}
          {loading ? "Agregando..." : "Agregar otro"}
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="relative w-full rounded-full bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-gradient-to-r hover:from-indigo-500 hover:to-blue-500 cursor-pointer disabled:opacity-60 z-10"
        >
          {loading ? (
            <i className="bi bi-arrow-repeat animate-spin mr-1.5"></i>
          ) : (
            <i className="bi bi-cart-plus mr-1.5"></i>
          )}
          {loading ? "Agregando..." : "Añadir al carrito"}
        </button>
      )}
    </article>
  );
}
