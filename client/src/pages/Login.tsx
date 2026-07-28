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
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/shop");
        }
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
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* ─── LEFT PANEL: Lifestyle image (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-end justify-start bg-slate-100 overflow-hidden">
        <img
          src="/images/hero_lifestyle.jpg"
          alt="NexusCart Lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle light overlay — keeps the premium-bright feel */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-emerald-50/30"></div>

        <div className="relative z-10 p-14 max-w-lg space-y-5">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              NexusCart<span className="text-emerald-500 text-3xl leading-none">.</span>
            </span>
          </Link>
          <h2 className="text-4xl font-light tracking-tight text-slate-900 leading-[1.15]">
            Todo lo que <br />
            <span className="font-semibold text-emerald-600">necesitas,</span> aquí.
          </h2>
          <p className="text-sm text-slate-500 font-light leading-relaxed max-w-xs">
            Tecnología inteligente, moda urbana y equipamiento de viaje premium seleccionados para tu estilo de vida.
          </p>
          <div className="flex gap-2 pt-1">
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-white/80 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              Envíos rápidos
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-white/80 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              Calidad premium
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Clean form ─── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 xl:px-20 bg-white relative">
        {/* Back link for mobile */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link
            to="/"
            className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Desktop logo */}
          <div className="hidden lg:block mb-10">
            <Link to="/">
              <span className="text-xl font-semibold tracking-tight text-slate-800">
                NexusCart<span className="text-emerald-500 text-2xl leading-none">.</span>
              </span>
            </Link>
          </div>

          {/* Mode toggle tabs */}
          <div className="flex bg-slate-100 rounded-full p-1 mb-8">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
                isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h1>
            <p className="text-sm text-slate-400 font-light mt-1">
              {isLogin
                ? "Ingresa tus credenciales para continuar."
                : "Únete a NexusCart y empieza a explorar."}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all font-light placeholder:text-slate-300"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all font-light placeholder:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all font-light placeholder:text-slate-300"
              />
            </div>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 px-4 py-3 rounded-2xl border border-rose-100">
                {error}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
              <div className="mt-4 text-xs text-slate-400 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl leading-relaxed space-y-1">
                <p className="font-medium text-slate-500 mb-1">Cuentas de demostración</p>
                <p>
                  <span className="font-medium text-slate-600">Admin:</span> admin@ecommerce.com /{" "}
                  <span className="font-medium">admin123</span>
                </p>
                <p>
                  <span className="font-medium text-slate-600">Cliente:</span> jgarcia@gmail.com /{" "}
                  <span className="font-medium">user123</span>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
