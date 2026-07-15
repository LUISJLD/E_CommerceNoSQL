interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex items-center border border-white/10 bg-white/5 rounded-full overflow-hidden focus-within:border-indigo-400/50 transition-all px-3">
      <i className="bi bi-search text-slate-400 text-xs"></i>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-2 text-sm w-full outline-none bg-transparent text-slate-100 placeholder:text-slate-500"
      />
    </div>
  );
}
