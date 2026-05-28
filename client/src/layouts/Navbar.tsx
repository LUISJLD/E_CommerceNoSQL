import { NAV_ITEMS } from "../shared/constants";

export default function Navbar() {
  return (
    <nav className="flex gap-8">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm text-gray-800 hover:text-blue-600 no-underline font-medium"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
