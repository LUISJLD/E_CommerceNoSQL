import { CATEGORIES } from "../../../shared/constants";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <aside className="w-44 shrink-0">
      <h2 className="text-base font-bold text-gray-900 mb-2">Categorías</h2>
      <ul className="space-y-0.5">
        {CATEGORIES.map((cat) => (
          <li key={cat}>
            <button
              className={`block w-full text-left px-2 py-1.5 text-sm cursor-pointer ${
                selected === cat
                  ? "text-blue-700 font-semibold"
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => onSelect(selected === cat ? null : cat)}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
