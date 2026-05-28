import { CATEGORIES } from "../../../shared/constants";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Electrónica": "bi-cpu",
  "Ropa": "bi-bag",
  "Hogar": "bi-house",
  "Deportes": "bi-bicycle",
};

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <aside className="w-44 shrink-0">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Categorías
      </h2>
      <ul className="space-y-0.5">
        <li>
          <button
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
              selected === null
                ? "bg-teal-50 text-teal-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => onSelect(null)}
          >
            <i className="bi bi-grid-3x3-gap text-xs w-4"></i>
            Todos
          </button>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat}>
            <button
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                selected === cat
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => onSelect(selected === cat ? null : cat)}
            >
              <i className={`bi ${CATEGORY_ICONS[cat] ?? "bi-tag"} text-xs w-4`}></i>
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
