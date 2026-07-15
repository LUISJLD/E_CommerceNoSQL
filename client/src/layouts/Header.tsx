import { Link, useLocation } from "react-router-dom";
import Logo from "../shared/components/Logo";
import SearchInput from "../shared/components/SearchInput";
import CartButton from "../features/cart/components/CartButton";
import ProfileMenu from "../features/auth/components/ProfileMenu";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const isShop = location.pathname === "/shop";
  const isOrders = location.pathname === "/orders";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex-1 max-w-sm">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2 ml-4">
          <Link
            to="/shop"
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              isShop
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tienda
          </Link>
          {!isAdmin && (
            <Link
              to="/orders"
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                isOrders
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mis Pedidos
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 ml-auto">
          {!isAdmin && <CartButton />}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
