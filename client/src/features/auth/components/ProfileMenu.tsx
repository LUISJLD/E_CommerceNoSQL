import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors shadow-sm"
        aria-label="Perfil"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-[60] overflow-hidden flex flex-col animate-scale-in origin-top-right">
          {/* User info */}
          <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Links */}
          <div className="p-2 space-y-1">
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Panel de Administración
              </Link>
            )}
            {!isAdmin && (
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-600 font-semibold hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
