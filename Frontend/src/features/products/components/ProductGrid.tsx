import type { Product } from "../../../shared/types";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  const { addItem, items } = useCart();
  const { isAdmin } = useAuth();

  // Set de IDs que ya están en el carrito para feedback visual inmediato
  const cartProductIds = new Set(items.map((i) => i.product.id));

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
      <h2 className="text-lg font-bold text-gray-900 mb-4">Nuestros Productos</h2>
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
