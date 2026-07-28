import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import ProductCard from "../features/products/components/ProductCard";
import type { Product } from "../shared/types";
import { fetchProducts } from "../services/product.service";

interface LandingPageProps {
  onSelectCategory: (category: string | null) => void;
}

export default function LandingPage({ onSelectCategory }: LandingPageProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((products) => {
        const byCategory: Record<string, Product[]> = {};
        products.forEach((p) => {
          if (!byCategory[p.category]) byCategory[p.category] = [];
          byCategory[p.category].push(p);
        });
        const picked: Product[] = [];
        const cats = Object.values(byCategory);
        let i = 0;
        while (picked.length < 4 && cats.some((c) => c.length > 0)) {
          const cat = cats[i % cats.length];
          if (cat && cat.length > 0) picked.push(cat.shift()!);
          i++;
        }
        setTrendingProducts(picked);
      })
      .catch(() => setTrendingProducts([]))
      .finally(() => setLoadingTrending(false));
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate("/login?mode=login");
      return;
    }
    await addItem(product);
  };

  const scrollToCatalog = () => onSelectCategory(null);
  const handleCategoryClick = (categoryName: string | null) => onSelectCategory(categoryName);

  return (
    <div className="w-full pb-24" style={{ backgroundColor: "#f9f7f4" }}>

      {/* ─── HERO ─── */}
      <section className="max-w-[1400px] mx-auto px-6 pt-6 pb-12">
        <div className="relative rounded-3xl overflow-hidden" style={{ height: "52vh" }}>
          <img
            src="/images/banner_todos.jpg"
            alt="NexusCart"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.80) 0%, rgba(15,23,42,0.3) 65%, transparent 100%)" }} />

          <div className="relative z-10 flex flex-col justify-between p-8 md:p-12" style={{ minHeight: "52vh" }}>
            {/* Fila superior */}
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-[11px] font-medium tracking-[0.25em] uppercase">
                Colección 2026
              </span>
              <span className="text-white/60 text-[11px] font-medium tracking-[0.25em] uppercase">
                ↓ Explorar
              </span>
            </div>

            {/* Fila inferior: texto izquierda, stats derecha — perfectamente alineados */}
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div className="max-w-md">
                <h1 className="text-white leading-tight mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.6rem)", fontFamily: "Syne, sans-serif", fontWeight: 800 }}>
                  Diseñado para <span style={{ color: "#10b981" }}>destacar.</span>
                </h1>
                <p className="text-white/60 text-sm mb-6 max-w-xs leading-relaxed" style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}>
                  Tecnología, moda y equipamiento premium. Todo en un solo lugar.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={scrollToCatalog}
                    className="px-5 py-2.5 text-xs font-bold tracking-wide text-white rounded-full transition-all duration-300 hover:scale-105"
                    style={{ background: "#10b981", fontFamily: "Syne, sans-serif" }}
                  >
                    Ver catálogo
                  </button>
                  <button
                    onClick={() => handleCategoryClick("Electrónica")}
                    className="px-5 py-2.5 text-xs font-bold tracking-wide rounded-full border border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    Electrónica →
                  </button>
                </div>
              </div>

              {/* Stats alineados al fondo con el texto */}
              <div className="flex gap-3 items-end shrink-0">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-white text-lg font-bold leading-none" style={{ fontFamily: "Syne, sans-serif" }}>+500</p>
                  <p className="text-white/55 text-[9px] uppercase tracking-wider mt-1">Productos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-white text-lg font-bold leading-none" style={{ fontFamily: "Syne, sans-serif" }}>4.9★</p>
                  <p className="text-white/55 text-[9px] uppercase tracking-wider mt-1">Calificación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORÍAS ─── */}
      <section className="max-w-[1400px] mx-auto px-6 mb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: "#10b981" }}>Explorar</p>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Categorías</h2>
          </div>
        </div>

        {/* Layout asimétrico: 1 grande + 2 pequeñas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ gridTemplateRows: "auto" }}>
          
          {/* Tecnología — ocupa 2 columnas */}
          <div
            onClick={() => handleCategoryClick("Electrónica")}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl cursor-pointer"
            style={{ height: "260px" }}
          >
            <img src="/images/category_tech.jpg" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Tech" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%)" }} />
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">01 / Electrónica</span>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Dispositivos Smart</h3>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-white border border-white/40 rounded-full px-3 py-1.5 group-hover:bg-white group-hover:text-slate-900 transition-all">
                  Explorar <span>→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ropa y Deportes — columna derecha apilada */}
          <div className="flex flex-col gap-4">
            <div
              onClick={() => handleCategoryClick("Ropa")}
              className="group relative overflow-hidden rounded-2xl cursor-pointer flex-1"
              style={{ minHeight: "120px" }}
            >
              <img src="/images/category_apparel.jpg" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Apparel" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">02 / Ropa</span>
                <div>
                  <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Moda & Estilo</h3>
                  <div className="text-white/70 text-xs">Ver colección →</div>
                </div>
              </div>
            </div>

            <div
            onClick={() => handleCategoryClick("Deportes")}
            className="group relative overflow-hidden rounded-2xl cursor-pointer flex-1"
            style={{ minHeight: "120px", background: "#0f172a" }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg className="w-24 h-24 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#10b981" }}>03 / Deportes</span>
              <div>
                <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Viajes & Aventuras</h3>
                <div className="text-white/50 text-xs">Ver colección →</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ─── TENDENCIAS ─── */}
      <section className="max-w-[1400px] mx-auto px-6 mb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: "#10b981" }}>Destacados</p>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
              Lo más popular
            </h2>
          </div>
          <button
            onClick={scrollToCatalog}
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors pb-0.5 border-b border-slate-300 hover:border-slate-900"
          >
            Ver todo
          </button>
        </div>

        {loadingTrending ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl h-80 animate-pulse" style={{ background: "#ede8e0" }} />
            ))}
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {trendingProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                inCart={false}
                hideAction={false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 rounded-3xl border border-slate-100" style={{ background: "#ede8e0" }}>
            <p className="text-sm font-medium">Explora el catálogo completo</p>
            <button onClick={scrollToCatalog} className="mt-4 text-xs font-semibold" style={{ color: "#10b981" }}>
              Ir a la tienda →
            </button>
          </div>
        )}
      </section>

      {/* ─── BANNER EDITORIAL ─── */}
      <section className="max-w-[1400px] mx-auto px-6">
        <div className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-slate-900" style={{ minHeight: "280px" }}>
          <div className="p-8 md:p-10 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400">
              Por qué NexusCart
            </p>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 mt-4" style={{ fontFamily: "Syne, sans-serif" }}>
                Herramientas para <span className="text-emerald-400">fluir</span> mejor.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-sm" style={{ fontFamily: "Inter, sans-serif", fontWeight: 300 }}>
                Diseños ergonómicos, rendimiento tecnológico y materiales premium — en armonía para acompañar tu ritmo diario.
              </p>
              <button
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-3 text-sm font-semibold text-white border-b pb-1 transition-colors hover:text-emerald-400 hover:border-emerald-400"
                style={{ borderColor: "#10b981", fontFamily: "Syne, sans-serif" }}
              >
                Descubrir la colección →
              </button>
            </div>
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 mt-6">
              {[["500+", "Productos"], ["48h", "Entrega"], ["4.9", "Rating"]].map(([val, label]) => (
                <div key={label}>
                  <p className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>{val}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <img
              src="/images/banner_laptop_user.jpg"
              alt="Product User Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0f172a 0%, transparent 50%)" }} />
          </div>
        </div>
      </section>
    </div>
  );
}
