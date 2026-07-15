import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  const redirect = searchParams.get("redirect");
  const q = searchParams.get("q");
  const cat = searchParams.get("cat");

  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await authService.login(email, password);
        login(data.token, data.user);
        
        if (data.user.role === 'admin') {
          navigate("/admin");
        } else {
          if (redirect === "checkout") {
            navigate("/shop?redirect=checkout");
          } else if (redirect === "shop") {
            navigate(`/shop?q=${q ? encodeURIComponent(q) : ""}&cat=${cat ? encodeURIComponent(cat) : ""}`);
          } else {
            navigate("/shop");
          }
        }
      } else {
        await authService.register(name, email, password);
        // Despues de registrarse, iniciar sesion automaticamente
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans overflow-x-hidden">
      {/* Background Glowing Blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="flex justify-center mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            N
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">
          {isLogin ? "Inicia sesión en tu cuenta" : "Crea una cuenta nueva"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          O{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer bg-transparent border-0"
          >
            {isLogin ? "regístrate si no tienes una" : "inicia sesión si ya tienes cuenta"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/5 border border-white/10 py-8 px-4 shadow-xl backdrop-blur-xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300">Nombre completo</label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">Correo electrónico</label>
              <div className="mt-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Contraseña</label>
              <div className="mt-1.5">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-full shadow-md text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
              </button>
            </div>
            
            {isLogin && (
              <div className="mt-4 text-[11px] text-slate-400 p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <p><strong>Admin por defecto:</strong> admin@ecommerce.com / admin123</p>
                <p><strong>Usuario por defecto:</strong> jgarcia@gmail.com / user123</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
