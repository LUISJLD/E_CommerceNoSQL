import type { ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Package, ShoppingCart } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const links = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Productos", path: "/admin/products", icon: <Package size={20} /> },
    { name: "Órdenes", path: "/admin/orders", icon: <ShoppingCart size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Admin<span className="text-blue-500">Panel</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
              {user?.name.charAt(0) || "A"}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate w-32">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-left text-red-400"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f4f7f6]">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm flex items-center px-8 border-b border-gray-100 justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                value={searchParams.get("search") || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchParams({ search: e.target.value });
                  } else {
                    setSearchParams({});
                  }
                }}
                placeholder="Buscar en esta página..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <Link 
              to="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
            >
              Visitar Tienda Pública
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
