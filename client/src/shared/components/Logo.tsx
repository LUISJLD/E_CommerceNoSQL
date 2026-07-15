export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none whitespace-nowrap">
      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
        N
      </div>
      <span className="text-lg font-bold text-white">
        Nexus<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Cart</span>
      </span>
    </div>
  );
}
