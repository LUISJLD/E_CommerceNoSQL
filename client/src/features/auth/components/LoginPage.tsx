import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Ingresa tu nombre para continuar."); return; }
    login(name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <i className="bi bi-cart-fill text-white text-lg"></i>
            </div>
            <span className="text-2xl font-bold text-gray-900">EcoCart</span>
          </div>
          <p className="text-sm text-gray-500">Tu tienda NoSQL favorita</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Bienvenido</h1>
          <p className="text-sm text-gray-400 mb-6">
            Ingresa tu nombre para comenzar a comprar
          </p>

          <form onSubmit={handle} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Ej: Juan García"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle"></i> {error}
                </p>
              )}
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <i className="bi bi-geo-alt text-teal-500 text-sm mt-0.5 flex-shrink-0"></i>
              <p className="text-xs text-teal-700 leading-relaxed">
                Se generará una <strong>dirección de envío aleatoria</strong> para tu cuenta.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="bi bi-arrow-right-circle"></i>
              Entrar a la tienda
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Universidad del Magdalena · Base de Datos NoSQL 2026-1
        </p>
      </div>
    </div>
  );
}
