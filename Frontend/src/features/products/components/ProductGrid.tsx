import type { Product } from "../../../shared/types";
import { useCart } from "../../../contexts/CartContext";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  const { addItem } = useCart();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="text-gray-500 text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <section className="flex-1">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Nuestros Productos</h2>
      <div className="grid grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addItem} />
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
