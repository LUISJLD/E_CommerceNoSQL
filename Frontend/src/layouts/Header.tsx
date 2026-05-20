import Logo from "../shared/components/Logo";
import SearchInput from "../shared/components/SearchInput";
import Navbar from "./Navbar";
import CartButton from "../features/cart/components/CartButton";
import ProfileMenu from "../features/auth/components/ProfileMenu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-gradient-to-b from-sky-100 to-sky-200 border-b border-gray-300 px-8 py-3">
      <div className="flex items-center gap-8 max-w-[1200px] mx-auto">
        <Logo />
        <SearchInput value={searchQuery} onChange={onSearchChange} />
        <Navbar />
        <div className="flex items-center gap-5 ml-auto">
          <CartButton />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
