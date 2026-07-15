import React, { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { useProducts } from "./hooks/useProducts";
import MainLayout from "./layouts/MainLayout";
import CategoryFilter from "./features/products/components/CategoryFilter";
import ProductGrid from "./features/products/components/ProductGrid";
import ProductModal from "./features/products/components/ProductModal";
import type { Product } from "./shared/types";
import OrdersView from "./features/orders/components/OrdersView";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";

// Componente para proteger rutas que requieren login
function PrivateRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ShopApp() {
  const { products, allProducts, loading, query, setQuery, category, setCategory, cacheSource, responseTime } = useProducts();
  const { user } = useAuth();
  
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  const [sortBy, setSortBy] = useState<string>("none");

  const processedProducts = useMemo(() => {
    // 1. Filtrar por precio máximo
    let list = products.filter((p) => p.price <= maxPrice);

    // 2. Ordenar según la opción seleccionada
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, maxPrice, sortBy]);

  return (
    <CartProvider userId={user?.email || "guest"} catalog={allProducts}>
      <MainLayout
        searchQuery={query}
        onSearchChange={setQuery}
        activePage={"shop"}
        onNavigate={() => {}}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
          <CategoryFilter 
            selected={category} 
            onSelect={setCategory} 
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
          />
          <ProductGrid 
            products={processedProducts} 
            loading={loading} 
            onOpenModal={setActiveProduct}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            cacheSource={cacheSource} 
            responseTime={responseTime} 
          />
        </div>
      </MainLayout>

      {activeProduct && (
        <ProductModal 
          product={activeProduct} 
          onClose={() => setActiveProduct(null)} 
        />
      )}
    </CartProvider>
  );
}

function OrdersApp() {
  const { user } = useAuth();

  return (
    <CartProvider userId={user?.email || "guest"} catalog={[]}>
      <MainLayout
        searchQuery=""
        onSearchChange={() => {}}
        activePage={"orders"}
        onNavigate={() => {}}
      >
        <OrdersView userId={user?.email || ""} />
      </MainLayout>
    </CartProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<LandingPage />} />

      <Route path="/shop" element={
        <PrivateRoute>
          <ShopApp />
        </PrivateRoute>
      } />

      <Route path="/orders" element={
        <PrivateRoute>
          <OrdersApp />
        </PrivateRoute>
      } />

      {/* Rutas de Admin */}
      <Route path="/admin/dashboard" element={
        <PrivateRoute requireAdmin>
          <AdminDashboard />
        </PrivateRoute>
      } />
      <Route path="/admin/products" element={
        <PrivateRoute requireAdmin>
          <AdminProducts />
        </PrivateRoute>
      } />
      <Route path="/admin/orders" element={
        <PrivateRoute requireAdmin>
          <AdminOrders />
        </PrivateRoute>
      } />
      {/* Redirección principal de /admin a /admin/dashboard */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
