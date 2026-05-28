import { useState } from "react";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

const CATEGORY_STYLES: Record<string, string> = {
  "Electrónica": "bg-blue-50 text-blue-700",
  "Ropa":        "bg-pink-50 text-pink-700",
  "Deportes":    "bg-orange-50 text-orange-700",
  "Hogar":       "bg-green-50 text-green-700",
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
  inCart?: boolean;
  hideAction?: boolean;
}

export default function ProductCard({ product, onAddToCart, inCart = false, hideAction = false }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(product.price);

  const stockColor =
    product.stock === 0
      ? "text-red-500"
      : product.stock <= 5
      ? "text-orange-500"
      : "text-gray-400";

  const categoryStyle = CATEGORY_STYLES[product.category] ?? "bg-gray-100 text-gray-600";

  const handleClick = async () => {
    if (loading || product.stock === 0) return;
    setLoading(true);
    try {
      await onAddToCart(product);
    } finally {
      setLoading(false);
    }
  };

  const placeholderSrc = `https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(product.name.charAt(0))}`;

  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Imagen */}
      <div className="w-full h-36 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
        <img
          src={imgError || !product.image ? placeholderSrc : product.image}
          alt={product.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Badge de categoría */}
        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle}`}>
          {product.category}
        </span>

        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {product.name}
        </h3>

        <p className="text-base font-bold text-gray-900 mt-auto">{formattedPrice}</p>

        <p className={`text-xs ${stockColor}`}>
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
          className="w-full bg-gray-100 text-gray-400 py-2 rounded-xl text-sm font-medium cursor-not-allowed"
        >
          Sin stock
        </button>
      ) : inCart ? (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-teal-50 text-teal-700 border border-teal-200 py-2 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <i className="bi bi-arrow-repeat animate-spin mr-1.5"></i>
          ) : (
            <i className="bi bi-check-circle mr-1.5"></i>
          )}
          {loading ? "Agregando..." : "Agregar otro"}
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-teal-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-60"
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
