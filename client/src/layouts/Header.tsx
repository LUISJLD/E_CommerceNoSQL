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
  const isShop = location.pathname === "/";
  const isOrders = location.pathname === "/orders";

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-8 py-0">
      {/* Top bar */}
      <div className="flex items-center gap-6 max-w-[1200px] mx-auto h-14">
        <Logo />
        <div className="flex-1 max-w-sm">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 ml-4">
          <Link
            to="/"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              isShop
                ? "bg-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tienda
          </Link>
          {!isAdmin && (
            <Link
              to="/orders"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                isOrders
                  ? "bg-teal-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
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
