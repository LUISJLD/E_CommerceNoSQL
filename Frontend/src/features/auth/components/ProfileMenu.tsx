import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="relative">
      <button
        className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-100"
        onClick={() => setOpen(!open)}
        aria-label="Perfil"
      >
        <i className="bi bi-person-circle text-lg text-gray-600"></i>
      </button>

      {open && (
        <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded p-4 w-60 shadow-md z-50">
          <p className="text-sm mb-1.5">
            Bienvenido, <strong>{user.username}</strong>
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            <strong>Dirección de envío por defecto:</strong>
            <br />
            {user.address}
          </p>
          <button
            className="text-gray-700 text-xs hover:underline cursor-pointer"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-left"></i> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
