import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

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
        <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded p-4 w-60 shadow-md z-50 flex flex-col gap-2">
          <p className="text-sm mb-1.5 border-b pb-2">
            Bienvenido, <strong>{user.name}</strong>
            <span className="block text-xs text-gray-500 mt-0.5">{user.email}</span>
          </p>

          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-2 py-1"
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-speedometer2"></i> Panel de Administración
            </Link>
          )}

          <button
            className="text-red-600 text-xs hover:underline cursor-pointer flex items-center gap-2 mt-2 pt-2 border-t text-left"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-left"></i> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
