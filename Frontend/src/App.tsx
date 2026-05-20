import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useProducts } from "./hooks/useProducts";
import MainLayout from "./layouts/MainLayout";
import CategoryFilter from "./features/products/components/CategoryFilter";
import ProductGrid from "./features/products/components/ProductGrid";

function AppContent() {
  const { products, loading, query, setQuery, category, setCategory } = useProducts();

  return (
    <MainLayout searchQuery={query} onSearchChange={setQuery}>
      <CategoryFilter selected={category} onSelect={setCategory} />
      <ProductGrid products={products} loading={loading} />
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
