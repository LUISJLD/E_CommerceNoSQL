export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none whitespace-nowrap">
      <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
        <i className="bi bi-cart3 text-white text-base"></i>
      </div>
      <span className="text-lg font-bold text-gray-900">
        Eco<span className="text-teal-600">Cart</span>
      </span>
    </div>
  );
}
