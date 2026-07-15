import { CATEGORIES } from "../../../shared/constants";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Electrónica": "bi-cpu",
  "Ropa": "bi-bag",
  "Hogar": "bi-house",
  "Deportes": "bi-bicycle",
};

export default function CategoryFilter({ selected, onSelect, maxPrice, onMaxPriceChange }: CategoryFilterProps) {
  return (
    <aside className="w-full md:w-64 shrink-0 font-sans p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg relative overflow-hidden">
      {/* Background radial glow inside the card */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        Categorías
      </h2>
      <ul className="space-y-2 relative z-10">
        <li>
          <button
            className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all duration-300 ${
              selected === null
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-transparent shadow-md shadow-indigo-500/10"
                : "text-slate-400 hover:text-white hover:bg-white/5 border-white/5 hover:border-white/10"
            }`}
            onClick={() => onSelect(null)}
          >
            <i className="bi bi-grid-3x3-gap text-sm w-4"></i>
            Todos los Productos
          </button>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat}>
            <button
              className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all duration-300 ${
                selected === cat
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-transparent shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-white/5 hover:border-white/10"
              }`}
              onClick={() => onSelect(selected === cat ? null : cat)}
            >
              <i className={`bi ${CATEGORY_ICONS[cat] ?? "bi-tag"} text-sm w-4`}></i>
              {cat}
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-white/5 mt-6 pt-6 relative z-10">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Presupuesto Máximo
        </h3>
        <div className="px-1 space-y-2">
          <input
            type="range"
            min="0"
            max="3000000"
            step="50000"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] font-semibold text-slate-400 font-mono">
            <span>$0</span>
            <span className="text-indigo-400">${maxPrice.toLocaleString("es-CO")}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
