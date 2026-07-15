import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Gift,
  Timer,
  Laptop,
  Shirt,
  Sofa,
  Sparkles,
  CreditCard,
  ArrowRight,
  RotateCcw,
  Headphones,
  BadgeCheck,
  Star,
  Plus,
  Minus,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const CATEGORIES = [
  { label: "Electrónica", icon: Laptop },
  { label: "Ropa", icon: Shirt },
  { label: "Hogar", icon: Sofa },
  { label: "Deportes", icon: Sparkles },
];

const ADVANTAGES = [
  { icon: ShieldCheck, title: "Pago Protegido", description: "Garantía de reembolso si algo sale mal con tu compra." },
  { icon: Truck, title: "Logística Express", description: "Seguimiento en tiempo real desde el envío hasta tu puerta." },
  { icon: Gift, title: "Puntos y Recompensas", description: "Acumula beneficios canjeables en cada compra." },
  { icon: RotateCcw, title: "Devoluciones Fáciles", description: "30 días para cambiar de opinión, sin costos ocultos." },
  { icon: Headphones, title: "Atención 24/7", description: "Un equipo humano listo para ayudarte a cualquier hora." },
  { icon: BadgeCheck, title: "Vendedores Verificados", description: "Cada tienda pasa por un proceso de validación." },
];

const TESTIMONIALS = [
  { quote: "Pedí un martes y me llegó el jueves. La app avisó en cada paso del envío.", author: "Laura M." },
  { quote: "Tuve un problema con un pedido y me devolvieron el dinero sin complicaciones.", author: "Carlos R." },
  { quote: "Los precios de las ofertas flash son increíbles, reviso todos los días.", author: "Daniela P." },
];

const STATS = [
  { value: "+10k", label: "Usuarios activos" },
  { value: "99%", label: "Entregas a tiempo" },
  { value: "4.8/5", label: "Calificación promedio" },
  { value: "24/7", label: "Soporte disponible" },
];

const currency = (value) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const ProductCard = ({ product, onAdd }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-indigo-400/40 hover:bg-white/10">
    <div
      className="pointer-events-none absolute -inset-24 opacity-0 transition duration-500 group-hover:opacity-100"
      style={{ background: "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.15), transparent 60%)" }}
    />
    <div className="relative mb-4 aspect-square w-full rounded-xl bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-transparent flex items-center justify-center overflow-hidden">
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className="max-h-[85%] max-w-[85%] object-contain transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="text-slate-500 text-xs">Sin imagen</div>
      )}
      {product.discount > 0 && (
        <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-indigo-500/30">
          -{product.discount}%
        </span>
      )}
    </div>
    <p className="relative mb-1 line-clamp-2 text-sm font-medium text-slate-100 h-10">{product.name}</p>
    <div className="relative mb-3 flex items-baseline gap-2">
      <span className="text-sm font-bold text-white">{currency(product.price)}</span>
      {product.originalPrice > product.price && (
        <span className="text-xs text-slate-500 line-through">{currency(product.originalPrice)}</span>
      )}
    </div>
    <span className="relative mb-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-300">
      <Star size={12} fill="currentColor" strokeWidth={0} /> 4.7
    </span>
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="relative w-full rounded-full bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-gradient-to-r hover:from-indigo-500 hover:to-blue-500 cursor-pointer"
    >
      Agregar al carrito
    </button>
  </div>
);

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}

const SectionHeader = ({ eyebrow, title, action = null }: SectionHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3 font-sans">
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">{eyebrow}</p>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    {action}
  </div>
);

export default function PremiumDarkLandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 32, seconds: 15 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar productos reales del backend
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Error loading products");
        return res.json();
      })
      .then((json) => {
        const items = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];
        setDbProducts(items.map((item) => ({
          id: item.productId as string,
          name: item.name as string,
          price: Number(item.price),
          originalPrice: Math.round(Number(item.price) * 1.25),
          discount: 20,
          stock: Number(item.stock),
          image: item.image as string,
          category: item.category as string,
        })));
      })
      .catch((err) => console.error("Error fetching catalog products:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds -= 1;
        else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (value) => value.toString().padStart(2, "0");

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("anonymous_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prev, { ...product, quantity: 1 }];
      }
      localStorage.setItem("anonymous_cart", JSON.stringify(updated));
      return updated;
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCartItems((prev) => {
      const updated = prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0);
      localStorage.setItem("anonymous_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  // Filtrar productos según categoría o búsqueda local
  const filteredProducts = useMemo(() => {
    let result = dbProducts;
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [dbProducts, selectedCategory, searchQuery]);

  const flashDeals = useMemo(() => filteredProducts.slice(0, 4), [filteredProducts]);
  const recommended = useMemo(() => filteredProducts.slice(2, 6), [filteredProducts]);
  const bestSellers = useMemo(() => [...filteredProducts].reverse().slice(0, 4), [filteredProducts]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
              N
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">NexusCart</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/30 hover:text-white sm:px-4 sm:py-2 sm:text-sm cursor-pointer"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => navigate("/login?mode=signup")}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/40 sm:px-5 sm:py-2 sm:text-sm cursor-pointer"
            >
              Registrarse
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-xl">
            <Sparkles size={14} /> Nueva colección de ofertas cada semana
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Compra el futuro,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              hoy mismo
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            Miles de productos, pagos protegidos y envíos rastreables en tiempo real, en una experiencia
            diseñada para moverse tan rápido como tú.
          </p>

          <form onSubmit={handleSearchSubmit} className="mx-auto mt-8 max-w-md w-full">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl transition focus-within:border-indigo-400/50 shadow-inner">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Busca productos en el catálogo..."
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
          </form>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/shop" : "/login")}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 cursor-pointer"
            >
              Explorar catálogo
              <ArrowRight size={16} />
            </button>
            <a
              href="#ofertas"
              className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-slate-200 backdrop-blur-xl transition hover:border-white/30 text-center"
            >
              Ver ofertas flash
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:grid-cols-4">
          {[
            { icon: Truck, label: "Envío gratis +$99.000" },
            { icon: ShieldCheck, label: "Pago 100% seguro" },
            { icon: RotateCcw, label: "Devoluciones sin costo" },
            { icon: Headphones, label: "Soporte 24/7" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2">
              <badge.icon size={18} className="shrink-0 text-indigo-400" />
              <span className="text-xs font-medium text-slate-300 sm:text-sm">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Categorías Integrada */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <SectionHeader eyebrow="Explorar catálogo" title="Selecciona una Categoría" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setSelectedCategory((prev) => (prev === cat.label ? null : cat.label))}
                className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition text-center flex flex-col items-center justify-center gap-3 cursor-pointer
                  ${isSelected
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                    : "border-white/10 bg-white/5 hover:border-indigo-400/40 hover:bg-white/10"
                  }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br transition duration-300
                    ${isSelected
                      ? "from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                      : "from-indigo-500/20 to-blue-500/10 text-indigo-300 group-hover:text-white group-hover:from-indigo-500 group-hover:to-blue-500"
                    }`}
                >
                  <Icon size={24} />
                </div>
                <span
                  className={`text-sm font-semibold transition
                    ${isSelected ? "text-white font-bold" : "text-slate-200 group-hover:text-white"}`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section id="ofertas" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <SectionHeader
          eyebrow="Por tiempo limitado"
          title="Ofertas Flash del Día"
          action={
            <div className="flex items-center gap-1 text-sm font-semibold text-cyan-300">
              <Timer size={16} className="mr-1" />
              <span className="rounded-md bg-white/5 px-2 py-1">{pad(countdown.hours)}</span>:
              <span className="rounded-md bg-white/5 px-2 py-1">{pad(countdown.minutes)}</span>:
              <span className="rounded-md bg-white/5 px-2 py-1">{pad(countdown.seconds)}</span>
            </div>
          }
        />
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando catálogo promocional...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {flashDeals.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-white/5 bg-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">Ecosistema</p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Más que una tienda</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((advantage) => (
              <div
                key={advantage.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-indigo-400/30"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 text-indigo-300">
                  <advantage.icon size={20} />
                </div>
                <p className="mb-1 text-sm font-semibold text-white">{advantage.title}</p>
                <p className="text-sm text-slate-400">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeader eyebrow="Curado para ti" title="Recomendados para Ti" />
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando productos recomendados...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <SectionHeader eyebrow="Tendencia" title="Lo Más Vendido" />
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando productos destacados...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-white/5 bg-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.author} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-3 flex gap-1 text-cyan-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="mb-4 text-sm text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="text-sm font-medium text-white">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-sm font-bold text-white">
                  N
                </div>
                <span className="text-lg font-semibold text-white">NexusCart</span>
              </div>
              <p className="mb-4 text-sm text-slate-400">
                Una experiencia de compra premium, diseñada para moverse rápido y con confianza.
              </p>
              <div className="flex gap-3">
                <a href="#" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>

            {[
              { title: "Soporte", links: ["Centro de ayuda", "Rastrear pedido", "Devoluciones"] },
              { title: "Legal", links: ["Términos y condiciones", "Política de privacidad"] },
              { title: "Compañía", links: ["Sobre nosotros", "Trabaja con nosotros"] },
            ].map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-sm font-semibold text-white">{column.title}</p>
                <ul className="space-y-2 text-sm text-slate-400">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-white">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
            <p className="text-xs text-slate-500">© 2026 NexusCart. Todos los derechos reservados.</p>
            <div className="flex flex-wrap gap-2">
              {["Visa", "Mastercard", "PSE", "Nequi"].map((method) => (
                <span key={method} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                  <CreditCard size={12} />
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setIsCartOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/40 transition hover:shadow-indigo-500/60 cursor-pointer"
      >
        <ShoppingBag size={18} />
        Carrito
        {cartCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
            {cartCount}
          </span>
        )}
      </button>

      {isCartOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-72 max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:w-96">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Tu carrito temporal</p>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              aria-label="Cerrar carrito"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {cartItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Tu carrito temporal está vacío por ahora.</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">{currency(item.price)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20 cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-4 text-center text-xs text-slate-200">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20 cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-sm font-bold text-white">{currency(cartTotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login?redirect=checkout")}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 cursor-pointer"
              >
                Iniciar sesión para comprar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
