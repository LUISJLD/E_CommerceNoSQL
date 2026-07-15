import { ShoppingBag, Cpu, Database, Server } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-gradient-to-b from-slate-950/60 to-slate-950 px-6 pt-12 pb-8 mt-16 w-full font-sans relative overflow-hidden">
      {/* Subtle radial glow in background */}
      <div className="absolute -left-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                NexusCart
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma demo de e-commerce serverless y de alto rendimiento, diseñada con almacenamiento distribuido NoSQL de baja latencia.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/20 transition-all flex items-center justify-center h-8 w-8">
                <i className="bi bi-twitter text-sm"></i>
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/20 transition-all flex items-center justify-center h-8 w-8">
                <i className="bi bi-instagram text-sm"></i>
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/20 transition-all flex items-center justify-center h-8 w-8">
                <i className="bi bi-linkedin text-sm"></i>
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/20 transition-all flex items-center justify-center h-8 w-8">
                <i className="bi bi-github text-sm"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Explorar
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <a href="/shop" className="hover:text-white transition-colors">Catálogo de Tienda</a>
              </li>
              <li>
                <a href="/" className="hover:text-white transition-colors">Página de Inicio</a>
              </li>
              <li>
                <a href="/shop" className="hover:text-white transition-colors">Mis Pedidos</a>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Soporte & Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Garantías y Cambios</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
              </li>
            </ul>
          </div>


        </div>

        <hr className="border-white/5 mb-6" />

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 font-medium font-sans">
            &copy; 2026 NexusCart. Todos los derechos reservados.
          </p>
          
          {/* Tech Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              <Cpu size={10} className="text-indigo-400" />
              <span>React 19</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              <Database size={10} className="text-sky-400" />
              <span>DynamoDB</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              <Server size={10} className="text-emerald-400" />
              <span>Redis Cache</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
