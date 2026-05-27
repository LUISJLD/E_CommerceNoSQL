import Logo from "../shared/components/Logo";
import SearchInput from "../shared/components/SearchInput";
import CartButton from "../features/cart/components/CartButton";
import ProfileMenu from "../features/auth/components/ProfileMenu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activePage: "shop" | "orders";
  onNavigate: (page: "shop" | "orders") => void;
}

export default function Header({ searchQuery, onSearchChange, activePage, onNavigate }: HeaderProps) {
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
          <button
            onClick={() => onNavigate("shop")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              activePage === "shop"
                ? "bg-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tienda
          </button>
          <button
            onClick={() => onNavigate("orders")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              activePage === "orders"
                ? "bg-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Mis Pedidos
          </button>
        </nav>

        <div className="flex items-center gap-4 ml-auto">
          <CartButton />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
