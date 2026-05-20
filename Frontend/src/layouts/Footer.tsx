export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-300 px-8 py-4 mt-auto">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center">
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-700 hover:underline">Mis Pedidos</a>
          <a href="#" className="text-sm text-gray-700 hover:underline">Soporte</a>
          <a href="#" className="text-sm text-gray-700 hover:underline">Política de Privacidad</a>
        </div>
        <p className="text-xs text-gray-500">&copy; 2024 EcoCart Inc.</p>
      </div>
    </footer>
  );
}
