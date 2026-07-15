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
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all ring-2 ring-white/10"
        aria-label="Perfil"
      >
        {user.name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <>
          {/* Transparent backdrop for click-out handling */}
          <div 
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setOpen(false)} 
          />
          
          {/* Glassmorphic Dropdown Card */}
          <div className="absolute top-10 right-0 bg-slate-900/95 border border-white/10 rounded-2xl p-4 w-60 shadow-2xl z-50 flex flex-col gap-2.5 backdrop-blur-xl animate-fade-in font-sans">
            <div className="text-xs pb-3 border-b border-white/5 text-slate-400">
              Bienvenido, 
              <strong className="text-white font-bold block mt-0.5 text-sm truncate">
                {user.name}
              </strong>
              <span className="block text-[10px] text-slate-500 font-mono mt-1 font-medium truncate">
                {user.email}
              </span>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="text-xs font-semibold text-slate-300 hover:text-indigo-400 flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-xl transition"
                onClick={() => setOpen(false)}
              >
                <i className="bi bi-speedometer2 text-indigo-400"></i> Panel de Administración
              </Link>
            )}

            <button
              className="text-rose-400 text-xs font-semibold hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer flex items-center gap-2 py-1.5 px-2 rounded-xl text-left transition"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <i className="bi bi-box-arrow-left text-rose-400"></i> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
