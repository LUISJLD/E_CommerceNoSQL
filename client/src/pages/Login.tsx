import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";

export default function Login() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  const [isLogin, setIsLogin] = useState(mode !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(mode !== "register");
    setError("");
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const data = await authService.login(email, password);
        login(data.token, data.user);
        navigate(data.user.role === "admin" ? "/admin" : "/shop");
      } else {
        await authService.register(name, email, password);
        const data = await authService.login(email, password);
        login(data.token, data.user);
        navigate("/shop");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* h-screen fijo en el contenedor raíz — ambos paneles siempre la misma altura */
    <div className="h-screen flex overflow-hidden" style={{ background: "#f9f7f4" }}>

      {/* ─── LEFT PANEL: imagen fija h-screen ─── */}
      <div className="hidden lg:block lg:w-[45%] relative flex-shrink-0">
        <img
          src="/images/login_banner.jpg"
          alt="NexusCart"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.55) 100%)" }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <Link to="/">
            <img src="/logo.png" alt="NexusCart" className="h-24 w-auto drop-shadow-lg" />
          </Link>

          {/* Texto central */}
          <div className="space-y-4">
            <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.25em]">
              Bienvenido a
            </p>
            <h2 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
              Tu tienda<br />
              todo en<br />
              <span className="text-emerald-400">un lugar.</span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs" style={{ fontWeight: 300 }}>
              Tecnología, moda y equipamiento premium para acompañar tu estilo de vida.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            {[["500+", "Productos"], ["48h", "Entrega"], ["4.9★", "Rating"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>{val}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: scroll interno si el contenido crece ─── */}
      <div className="w-full lg:w-[55%] flex-shrink-0 overflow-y-auto bg-white relative">

        {/* Volver — mobile */}
        <div className="absolute top-6 left-6 lg:hidden z-10">
          <Link to="/" className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Inicio
          </Link>
        </div>

        {/* Centra el formulario verticalmente dentro del scroll */}
        <div className="min-h-full flex items-center justify-center px-6 py-16 md:px-16 xl:px-24">
          <div className="w-full max-w-sm">

            {/* Logo — desktop */}
            <div className="hidden lg:block mb-10">
              <Link to="/">
                <img src="/logo.png" alt="NexusCart" className="h-24 w-auto" />
              </Link>
            </div>

            {/* Encabezado */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
                {isLogin ? "Bienvenido de nuevo" : "Crear cuenta"}
              </h1>
              <p className="text-sm text-slate-400">
                {isLogin ? "Ingresa tus credenciales para continuar." : "Únete a NexusCart y empieza a explorar."}
              </p>
            </div>

            {/* Tabs underline */}
            <div className="flex border-b border-slate-200 mb-6 gap-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`pb-3 text-sm font-semibold transition-all ${isLogin ? "text-slate-900 border-b-2 border-emerald-500 -mb-px" : "text-slate-400 hover:text-slate-600"}`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`pb-3 text-sm font-semibold transition-all ${!isLogin ? "text-slate-900 border-b-2 border-emerald-500 -mb-px" : "text-slate-400 hover:text-slate-600"}`}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Formulario */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Campo nombre — ocupa espacio siempre para evitar salto de layout */}
              <div style={{ height: !isLogin ? "auto" : 0, overflow: "hidden", transition: "height 0.25s ease" }}>
                <div className="pb-0.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required={!isLogin}
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300 bg-white"
                />
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ background: loading ? "#6ee7b7" : "#059669", boxShadow: "0 4px 14px rgba(5,150,105,0.35)" }}
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {isLogin && (
                <div className="mt-1 text-xs text-slate-400 px-4 py-3 rounded-xl leading-relaxed space-y-1" style={{ background: "#f9f7f4", border: "1px solid #e8e2d8" }}>
                  <p className="font-bold text-slate-500 mb-1.5 uppercase tracking-wide text-[10px]">Cuenta de demo</p>
                  <p><span className="font-semibold text-slate-600">Cliente:</span> jgarcia@gmail.com / user123</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
