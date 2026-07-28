import { useState } from "react";
import type { Product } from "../../../shared/types";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useNavigate } from "react-router-dom";

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
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  const cartProductIds = new Set(items.map((i) => i.product.id));

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate("/login?mode=login");
      return;
    }
    await addItem(product);
  };

  const badgeClass =
    cacheSource === "CACHE"
      ? "bg-green-50 text-green-700 border border-green-100"
      : cacheSource === "DATABASE"
      ? "bg-amber-50 text-amber-700 border border-amber-100"
      : "bg-slate-100 text-slate-400 border border-slate-200";

  const badgeLabel =
    cacheSource === "CACHE"
      ? "⚡ Redis Cache"
      : cacheSource === "DATABASE"
      ? "🍃 MongoDB Atlas"
      : null;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-[32px] h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <section className="flex-1">
      {/* Cache / response-time metadata strip */}
      {(badgeLabel || responseTime > 0) && (
        <div className="flex items-center gap-3 mb-2">
          {badgeLabel && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
              {badgeLabel}
            </span>
          )}
          {responseTime > 0 && (
            <span className="text-[10px] font-medium text-slate-400">{responseTime} ms</span>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-[32px] border border-slate-100">
          <svg className="w-10 h-10 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Sin resultados para esta búsqueda</p>
          <p className="text-xs text-slate-400 mt-1 font-light">Prueba ajustando los filtros o el término de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product, index) => (
            <div 
              key={product.id}
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onClick={handleOpenModal}
                inCart={cartProductIds.has(product.id)}
                hideAction={isAdmin}
              />
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
          inCart={cartProductIds.has(selectedProduct.id)}
          hideAction={isAdmin}
        />
      )}
    </section>
  );
}
