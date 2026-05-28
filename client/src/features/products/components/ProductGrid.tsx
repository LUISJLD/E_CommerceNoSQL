import type { Product } from "../../../shared/types";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  cacheSource?: "CACHE" | "DATABASE" | "UNKNOWN";
  responseTime?: number;
}

export default function ProductGrid({
  products,
  loading,
  cacheSource = "UNKNOWN",
  responseTime = 0,
}: ProductGridProps) {
  const { addItem, items } = useCart();
  const { isAdmin } = useAuth();

  const cartProductIds = new Set(items.map((i) => i.product.id));

  const badgeClass =
    cacheSource === "CACHE"
      ? "bg-green-100 text-green-800 border border-green-300"
      : cacheSource === "DATABASE"
      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
      : "bg-gray-100 text-gray-400 border border-gray-200";

  const badgeLabel =
    cacheSource === "CACHE"
      ? "⚡ Redis Cache"
      : cacheSource === "DATABASE"
      ? "🗄️ DynamoDB"
      : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <i className="bi bi-arrow-repeat text-3xl text-teal-400 animate-spin block mb-3"></i>
          <span className="text-gray-400 text-sm">Cargando productos...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="flex-1">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900">Nuestros Productos</h2>
        {badgeLabel && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {badgeLabel}
          </span>
        )}
        {responseTime > 0 && (
          <span className="text-xs text-gray-400">{responseTime} ms</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addItem}
            inCart={cartProductIds.has(product.id)}
            hideAction={isAdmin}
          />
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-center text-gray-500 py-10 text-sm">
          No se encontraron productos.
        </p>
      )}
    </section>
  );
}
