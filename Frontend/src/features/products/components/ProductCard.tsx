import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options
  ).format(product.price);

  return (
    <article className="bg-gray-100 border border-gray-200 rounded p-4 text-center">
      <div className="w-full h-36 flex items-center justify-center mb-3 bg-gray-100 rounded">
        <img
          src={product.image}
          alt={product.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{product.name}</h3>
      <p className="text-sm font-bold text-gray-900 mb-0.5">{formattedPrice}</p>
      <p className="text-xs text-gray-600 mb-3">Stock: {product.stock}</p>
      <button
        className="bg-blue-600 text-white px-5 py-1.5 rounded text-sm font-medium hover:bg-blue-700 cursor-pointer"
        onClick={() => onAddToCart(product)}
      >
        Añadir al Carrito
      </button>
    </article>
  );
}
