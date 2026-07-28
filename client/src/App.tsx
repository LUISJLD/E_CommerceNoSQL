import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { useProducts } from "./hooks/useProducts";
import type { PriceRange, SortBy } from "./services/product.service";
import MainLayout from "./layouts/MainLayout";
import CategoryBanner from "./features/products/components/CategoryBanner";
import CategoryFilter from "./features/products/components/CategoryFilter";
import ProductGrid from "./features/products/components/ProductGrid";
import OrdersView from "./features/orders/components/OrdersView";
import SettingsView from "./features/settings/components/SettingsView";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";

// ── Protected route wrapper ──────────────────────────────────────────────────
function PrivateRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactElement;
  requireAdmin?: boolean;
}) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

// ── Landing page shell ──────────────────────────────────────────────────────
function LandingApp() {
  const navigate = useNavigate();
  const handleSelectCategory = (cat: string | null) => {
    navigate(`/shop?category=${cat || ""}`);
  };

  return (
    <MainLayout searchQuery="" onSearchChange={() => {}} activePage="shop">
      <LandingPage onSelectCategory={handleSelectCategory} />
    </MainLayout>
  );
}

// ── Shop page shell ──────────────────────────────────────────────────────────
interface ShopAppProps {
  products: any[];
  loading: boolean;
  query: string;
  setQuery: (val: string) => void;
  category: string | null;
  setCategory: (val: string | null) => void;
  priceRange: PriceRange;
  setPriceRange: (val: PriceRange) => void;
  sortBy: SortBy;
  setSortBy: (val: SortBy) => void;
  cacheSource: any;
  responseTime: number;
  priceBounds: [number, number];
}

function ShopApp({
  products,
  loading,
  query,
  setQuery,
  category,
  setCategory,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  cacheSource,
  responseTime,
  priceBounds,
}: ShopAppProps) {
  return (
    <MainLayout searchQuery={query} onSearchChange={setQuery} activePage="shop">
      <div className="max-w-[1400px] mx-auto w-full px-8 pt-6 pb-12 space-y-4 md:space-y-6">
        <CategoryBanner category={category} />
        <CategoryFilter 
          selected={category} 
          onSelect={setCategory} 
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          priceBounds={priceBounds}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />
        <ProductGrid products={products} loading={loading} cacheSource={cacheSource} responseTime={responseTime} />
      </div>
    </MainLayout>
  );
}

// ── Orders page shell ────────────────────────────────────────────────────────
function OrdersApp() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  
  return (
    <MainLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activePage="orders"
      onNavigate={() => {}}
    >
      <div className="max-w-[1400px] mx-auto w-full px-8 pt-6 pb-12">
        <OrdersView userId={user?.email || ""} searchQuery={searchQuery} />
      </div>
    </MainLayout>
  );
}

// ── Settings page shell ──────────────────────────────────────────────────────
function SettingsApp() {
  return (
    <MainLayout
      searchQuery=""
      onSearchChange={() => {}}
      activePage="shop"
      onNavigate={() => {}}
    >
      <div className="max-w-[1400px] mx-auto w-full px-8 pt-6 pb-12">
        <SettingsView />
      </div>
    </MainLayout>
  );
}

// ── Root content (inside AuthProvider) ──────────────────────────────────────
function AppContent() {
  const { user } = useAuth();
  const {
    products,
    allProducts,
    loading,
    query,
    setQuery,
    category,
    setCategory,
    priceRange,
    setPriceRange,
    priceBounds,
    sortBy,
    setSortBy,
    cacheSource,
    responseTime,
  } = useProducts();

  return (
    <CartProvider userId={user?.email || "guest"} catalog={allProducts}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<LandingApp />} />
          <Route
            path="/shop"
            element={
              <ShopApp
                products={products}
                loading={loading}
                query={query}
                setQuery={setQuery}
                category={category}
                setCategory={setCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sortBy={sortBy}
                setSortBy={setSortBy}
                cacheSource={cacheSource}
                responseTime={responseTime}
                priceBounds={priceBounds}
              />
            }
          />

          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrdersApp />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsApp />
              </PrivateRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute requireAdmin>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <PrivateRoute requireAdmin>
                <AdminProducts />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PrivateRoute requireAdmin>
                <AdminOrders />
              </PrivateRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

// ── App entry ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
