import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useCart } from "../contexts/CartContext";
import CartDrawer from "../features/cart/components/CartDrawer";

interface MainLayoutProps {
  children: ReactNode;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activePage?: "shop" | "orders" | "admin";
  onNavigate?: (page: "shop" | "orders" | "admin") => void;
}

export default function MainLayout({
  children,
  searchQuery,
  onSearchChange,
}: MainLayoutProps) {
  const { isCartOpen, setIsCartOpen } = useCart();

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      {/* Background Glowing Blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <Header
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      <main className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 gap-6 z-10">
        {children}
      </main>
      <Footer />

      {isCartOpen && <CartDrawer onClose={() => setIsCartOpen(false)} />}
    </div>
  );
}
