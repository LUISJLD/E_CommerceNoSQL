import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

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
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      <main className="flex flex-1 max-w-[1200px] mx-auto w-full px-8 py-6 gap-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
