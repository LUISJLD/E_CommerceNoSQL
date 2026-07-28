import { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "../../../shared/constants";
import type { PriceRange, SortBy } from "../../../services/product.service";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  priceRange: PriceRange;
  onPriceRangeChange: (range: PriceRange) => void;
  priceBounds: [number, number];
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "default", label: "Relevancia" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
  { value: "name_asc", label: "Alfabético A–Z" },
];

export default function CategoryFilter({
  selected,
  onSelect,
  priceRange,
  onPriceRangeChange,
  priceBounds,
  sortBy,
  onSortByChange,
}: CategoryFilterProps) {
  const [openDropdown, setOpenDropdown] = useState<"sort" | "price" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPriceAll = priceRange[0] === null && priceRange[1] === null;
  const hasActiveFilters = selected !== null || !isPriceAll || sortBy !== "default";
  
  // Safe max bounds calculation
  const maxBound = Math.max(priceBounds[1], 100);
  const currentSliderValue = priceRange[1] === null ? maxBound : priceRange[1];

  const handleClearAll = () => {
    onSelect(null);
    onPriceRangeChange([null, null]);
    onSortByChange("default");
  };

  return (
    <div className="w-full space-y-4">
      {/* ── Row 1: Section title + clear button ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light text-slate-800 tracking-tight">
          Nuestros <span className="font-semibold text-emerald-600">Productos</span>
        </h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Limpiar Filtros
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Row 2: Category tabs (left) + Sort dropdown (right) ── */}
      <div className="flex items-end justify-between gap-4">
        {/* Category tab strip */}
        <div className="flex items-center gap-6 overflow-x-auto border-b border-slate-100 scrollbar-none flex-1">
          <button
            className={`pb-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 cursor-pointer ${
              selected === null
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-800 hover:border-slate-300"
            }`}
            onClick={() => onSelect(null)}
          >
            Todos
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selected === cat;
            return (
              <button
                key={cat}
                className={`pb-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-800 hover:border-slate-300"
                }`}
                onClick={() => onSelect(isSelected ? null : cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Dropdowns (Price + Sort) */}
        <div className="flex items-center gap-2 flex-shrink-0 mb-[1px]" ref={containerRef}>
          
          {/* Price Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border rounded-full transition-all cursor-pointer ${
                openDropdown === "price" || !isPriceAll
                  ? "border-emerald-400 ring-2 ring-emerald-100 text-slate-800"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isPriceAll ? "Precio" : `Hasta $${currentSliderValue.toLocaleString()}`}
            </button>

            {openDropdown === "price" && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden z-50 animate-scale-in origin-top-right p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Precio Máximo</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {isPriceAll ? "Todos" : `$${currentSliderValue.toLocaleString()}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxBound}
                  step={Math.max(10, Math.floor(maxBound / 100))}
                  value={currentSliderValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= maxBound) {
                      onPriceRangeChange([null, null]);
                    } else {
                      onPriceRangeChange([0, val]);
                    }
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-100 mb-2"
                />
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
              className={`flex items-center gap-2 pl-4 pr-3 py-2 text-xs font-medium bg-white border rounded-full transition-all cursor-pointer ${
                openDropdown === "sort"
                  ? "border-emerald-400 ring-2 ring-emerald-100 text-slate-800"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdown === "sort" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDropdown === "sort" && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden z-50 animate-scale-in origin-top-right">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = opt.value === sortBy;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortByChange(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
