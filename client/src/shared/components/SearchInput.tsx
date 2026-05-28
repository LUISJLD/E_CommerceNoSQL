interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
      <i className="bi bi-search text-gray-400 text-xs pl-3"></i>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-2 text-sm w-full outline-none bg-transparent"
      />
    </div>
  );
}
