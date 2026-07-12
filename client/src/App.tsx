import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { useProducts } from "./hooks/useProducts";
import MainLayout from "./layouts/MainLayout";
import CategoryFilter from "./features/products/components/CategoryFilter";
import ProductGrid from "./features/products/components/ProductGrid";
import OrdersView from "./features/orders/components/OrdersView";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";

// Componente para proteger rutas que requieren login
function PrivateRoute({ children, requireAdmin = false }: { children: JSX.Element, requireAdmin?: boolean }) {
  const { user, isAuthenticated, isAdmin } = useAuth();

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

  return (
    <CartProvider userId={user?.email || "guest"} catalog={allProducts}>
      <MainLayout
        searchQuery={query}
        onSearchChange={setQuery}
        activePage={"shop"}
        onNavigate={() => {}}
      >
        <CategoryFilter selected={category} onSelect={setCategory} />
        <ProductGrid products={products} loading={loading} cacheSource={cacheSource} responseTime={responseTime} />
      </MainLayout>
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
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
      </Router>
    </AuthProvider>
  );
}
