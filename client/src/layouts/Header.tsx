import { Link, useLocation } from "react-router-dom";
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
  const { isAuthenticated, isAdmin } = useAuth();
  const isHome = location.pathname === "/";
  const isOrders = location.pathname === "/orders";
  const isSettings = location.pathname === "/settings";

  const handleInicioClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-8 py-0 shadow-sm transition-all">
      <div className="relative flex items-center justify-between max-w-[1400px] mx-auto h-20">
        {/* Left: Logo */}
        <div className="flex-1 flex items-center">
          <Link to="/" onClick={handleInicioClick} className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-slate-800">
              NexusCart<span className="text-emerald-500 text-2xl leading-none">.</span>
            </span>
          </Link>
          
          {/* Nav Links (Tienda + Orders) */}
          <nav className="hidden md:flex items-center gap-6 ml-10">
            {isAuthenticated && !isAdmin && (
              <>
                <Link
                  to="/shop"
                  className={`text-sm font-medium transition-colors relative py-2 ${
                    location.pathname === "/shop" ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Tienda
                  {location.pathname === "/shop" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 rounded-t-full"></span>
                  )}
                </Link>
                <Link
                  to="/orders"
                  className={`text-sm font-medium transition-colors relative py-2 ${
                    isOrders ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mis Pedidos
                  {isOrders && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 rounded-t-full"></span>
                  )}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Center: Search */}
        {!isSettings && (
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md hidden md:block">
            <SearchInput value={searchQuery} onChange={onSearchChange} />
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex-1 flex items-center justify-end gap-5">
          {isAuthenticated ? (
            <>
              {!isAdmin && !isSettings && <CartButton />}
              {!isAdmin && !isSettings && <div className="w-px h-5 bg-slate-200 mx-1"></div>}
              <div className="flex items-center gap-3">
                <ProfileMenu />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login?mode=login"
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Ingresar
              </Link>
              <Link
                to="/login?mode=register"
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
