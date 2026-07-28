import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ background: "#f9f7f4", borderTop: "1px solid #e8e2d8", color: "#1a1a1a" }} className="px-8 pt-16 pb-8 mt-auto">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Newsletter Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-12 border-b border-slate-200">
          <div className="text-left">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
              Únete a nuestra comunidad
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Suscríbete para recibir noticias de nuestros nuevos lanzamientos y ofertas exclusivas.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm hover:border-emerald-200 transition-colors">
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico..."
              className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400"
            />
            <button className="bg-emerald-500 text-white text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-full hover:bg-slate-900 transition-colors cursor-pointer shadow-sm">
              Suscribirse
            </button>
          </div>
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {/* Logo & Vibe */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="NexusCart" className="h-24 w-auto scale-110 origin-left opacity-90 drop-shadow-sm" />
            </Link>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Equipos de tecnología, prendas de streetwear y artículos de viaje premium seleccionados con los mejores estándares para complementar tu estilo de vida activo.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-900 mb-4">Colecciones</h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><Link to="/shop?category=Electrónica" className="hover:text-emerald-600 transition-colors">Tecnología Inteligente</Link></li>
              <li><Link to="/shop?category=Ropa" className="hover:text-emerald-600 transition-colors">Ropa Urbana</Link></li>
              <li><Link to="/shop?category=Deportes" className="hover:text-emerald-600 transition-colors">Accesorios de Viaje</Link></li>
              <li><Link to="/shop" className="hover:text-emerald-600 transition-colors">Nuevos Lanzamientos</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-900 mb-4">Información</h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Envíos & Devoluciones</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Términos de Servicio</a></li>
            </ul>
          </div>


        </div>

        {/* Bottom Credits */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            &copy; 2026 NexusCart. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-xs text-slate-400 font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacidad</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-slate-900 transition-colors">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
