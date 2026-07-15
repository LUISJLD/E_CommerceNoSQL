import type { Product } from "../../../shared/types";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onOpenModal: (product: Product) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  cacheSource?: "CACHE" | "DATABASE" | "UNKNOWN";
  responseTime?: number;
}

export default function ProductGrid({
  products,
  loading,
  onOpenModal,
  sortBy,
  onSortByChange,
  cacheSource = "UNKNOWN",
  responseTime = 0,
}: ProductGridProps) {
  const { addItem, items } = useCart();
  const { isAdmin } = useAuth();

  const cartProductIds = new Set(items.map((i) => i.product.id));

  const badgeClass =
    cacheSource === "CACHE"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : cacheSource === "DATABASE"
      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      : "bg-slate-500/10 text-slate-500 border border-slate-500/20";

  const badgeLabel =
    cacheSource === "CACHE"
      ? "⚡ Redis Cache"
      : cacheSource === "DATABASE"
      ? "🗄️ DynamoDB"
      : null;

  if (loading) {
    return (
      <section className="flex-1 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded-full mb-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-white/5 bg-white/5 p-4 flex flex-col gap-3 h-[290px]">
              <div className="aspect-square w-full rounded-xl bg-white/5 h-36" />
              <div className="h-4 w-12 bg-white/5 rounded-full mt-2" />
              <div className="h-4 w-full bg-white/5 rounded-md mt-1" />
              <div className="h-4 w-2/3 bg-white/5 rounded-md mt-1" />
              <div className="h-6 w-16 bg-white/5 rounded-md mt-auto" />
              <div className="h-8 w-full bg-white/5 rounded-full mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Nuestros Productos</h2>
          {badgeLabel && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
              {badgeLabel}
            </span>
          )}
          {responseTime > 0 && (
            <span className="text-xs font-medium text-slate-400 font-mono">⏱ {responseTime} ms</span>
          )}
        </div>

        {!loading && products.length > 0 && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="none" className="bg-slate-900 text-white">Destacados</option>
              <option value="price-asc" className="bg-slate-900 text-white">Precio: Bajo a Alto</option>
              <option value="price-desc" className="bg-slate-900 text-white">Precio: Alto a Bajo</option>
              <option value="name-asc" className="bg-slate-900 text-white">Nombre: A-Z</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addItem}
            onOpenModal={onOpenModal}
            inCart={cartProductIds.has(product.id)}
            hideAction={isAdmin}
          />
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-center text-slate-500 py-10 text-sm">
          No se encontraron productos.
        </p>
      )}
    </section>
  );
}
