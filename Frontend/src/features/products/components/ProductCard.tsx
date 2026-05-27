import { useState } from "react";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
  inCart?: boolean;
}

export default function ProductCard({ product, onAddToCart, inCart = false }: ProductCardProps) {
  const [loading, setLoading] = useState(false);

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

  const handleClick = async () => {
    if (loading || product.stock === 0) return;
    setLoading(true);
    try {
      await onAddToCart(product);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Imagen */}
      <div className="w-full h-36 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-1">
        <span className="text-[10px] font-medium text-teal-600 uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
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
      {product.stock === 0 ? (
        <button
          disabled
          className="w-full bg-gray-100 text-gray-400 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Sin stock
        </button>
      ) : inCart ? (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-teal-50 text-teal-700 border border-teal-200 py-2 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors cursor-pointer disabled:opacity-60"
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
          className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-60"
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
