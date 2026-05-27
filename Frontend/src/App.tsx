import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { useProducts } from "./hooks/useProducts";
import MainLayout from "./layouts/MainLayout";
import CategoryFilter from "./features/products/components/CategoryFilter";
import ProductGrid from "./features/products/components/ProductGrid";
import OrdersView from "./features/orders/components/OrdersView";

type Page = "shop" | "orders";

function AppContent() {
  const [page, setPage] = useState<Page>("shop");
  // useProducts carga el catálogo completo — lo pasamos al CartProvider
  // para que los nombres del carrito sean los reales del catálogo
  const { products, allProducts, loading, query, setQuery, category, setCategory } = useProducts();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        No hay sesión activa.
      </div>
    );
  }

  return (
    <CartProvider userId={user.username} catalog={allProducts}>
      <MainLayout
        searchQuery={query}
        onSearchChange={setQuery}
        activePage={page}
        onNavigate={setPage}
      >
        {page === "shop" ? (
          <>
            <CategoryFilter selected={category} onSelect={setCategory} />
            <ProductGrid products={products} loading={loading} />
          </>
        ) : (
          <OrdersView userId={user.username} />
        )}
      </MainLayout>
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
