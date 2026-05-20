interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="flex border border-gray-400 rounded-sm bg-white">
      <input
        type="text"
        placeholder="Buscar productos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none px-3 py-1.5 text-sm w-52 outline-none bg-white"
      />
      <button
        className="bg-white border-l border-gray-300 px-2.5 cursor-pointer hover:bg-gray-100"
        aria-label="Buscar"
      >
        <i className="bi bi-search text-gray-600 text-xs"></i>
      </button>
    </div>
  );
}
