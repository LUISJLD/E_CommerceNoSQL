interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 bg-white/60 border border-slate-200/70 rounded-full px-4 py-2 hover:border-slate-300 focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition-all backdrop-blur-sm">
      {/* Minimal magnifier icon */}
      <svg
        className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-light"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
