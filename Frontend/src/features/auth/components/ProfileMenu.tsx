import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const displayName = user.username
    .split(".")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const initials = user.username
    .split(".")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors"
        aria-label="Perfil"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 z-50">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">@{user.username}</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Dirección de envío
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{user.address}</p>
          </div>

          <button
            onClick={logout}
            className="w-full text-left text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <i className="bi bi-box-arrow-left"></i> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
