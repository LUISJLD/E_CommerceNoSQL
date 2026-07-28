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
        // Pick 4 products spread across categories for variety
        const byCategory: Record<string, Product[]> = {};
        products.forEach((p) => {
          if (!byCategory[p.category]) byCategory[p.category] = [];
          byCategory[p.category].push(p);
        });
        const picked: Product[] = [];
        // Round-robin pick from each category until we have 4
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
    <div className="w-full bg-white pb-20">
      {/* ─── HERO ─── */}
      <section className="relative w-full h-[65vh] min-h-[500px] flex items-center justify-center overflow-hidden mb-16 rounded-[40px] mx-auto max-w-[1400px] mt-4">
        <img
          src="/images/hero_lifestyle.jpg"
          alt="NexusCart"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto gap-6">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-800 bg-emerald-100/90 px-4 py-2 rounded-full shadow-sm">
            NUEVA COLECCIÓN
          </span>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-slate-900 leading-[1.1]">
            Estilo que <span className="font-semibold text-emerald-600">inspira</span> <br /> tu día a día
          </h1>
          <p className="text-slate-700 text-lg md:text-xl font-light max-w-xl">
            Descubre nuestra cuidada selección de tecnología, moda y accesorios diseñados para elevar tu rutina de forma natural.
          </p>
          <button
            onClick={scrollToCatalog}
            className="mt-6 px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-emerald-600 transition-colors duration-300 shadow-xl shadow-slate-900/10 flex items-center gap-3"
          >
            Explorar Tienda
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ─── CATEGORÍAS ─── */}
      <section className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {/* Tecnología */}
        <div
          onClick={() => handleCategoryClick("Electrónica")}
          className="group bg-slate-50 hover:bg-emerald-50/50 rounded-[32px] p-6 h-[260px] flex items-center justify-between cursor-pointer border border-slate-100 hover:border-emerald-100 transition-all duration-300"
        >
          <div className="flex flex-col h-full justify-between w-1/2 pr-4">
            <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Electrónica</span>
            <div>
              <h3 className="text-2xl font-light text-slate-900 leading-tight mb-4">
                Dispositivos<br /><span className="font-semibold">Smart</span>
              </h3>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full rounded-2xl overflow-hidden shadow-sm">
            <img src="/images/category_tech.jpg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Tech" />
          </div>
        </div>

        {/* Ropa */}
        <div
          onClick={() => handleCategoryClick("Ropa")}
          className="group bg-slate-50 hover:bg-orange-50/50 rounded-[32px] p-6 h-[260px] flex items-center justify-between cursor-pointer border border-slate-100 hover:border-orange-100 transition-all duration-300"
        >
          <div className="flex flex-col h-full justify-between w-1/2 pr-4">
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">Apparel</span>
            <div>
              <h3 className="text-2xl font-light text-slate-900 leading-tight mb-4">
                Moda &<br /><span className="font-semibold">Estilo</span>
              </h3>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full rounded-2xl overflow-hidden shadow-sm">
            <img src="/images/category_apparel.jpg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Apparel" />
          </div>
        </div>

        {/* Deportes */}
        <div
          onClick={() => handleCategoryClick("Deportes")}
          className="group bg-slate-50 hover:bg-sky-50/50 rounded-[32px] p-6 h-[260px] flex items-center justify-between cursor-pointer border border-slate-100 hover:border-sky-100 transition-all duration-300"
        >
          <div className="flex flex-col h-full justify-between w-1/2 pr-4">
            <span className="text-sky-600 text-[10px] font-bold uppercase tracking-wider">Equipamiento</span>
            <div>
              <h3 className="text-2xl font-light text-slate-900 leading-tight mb-4">
                Viajes &<br /><span className="font-semibold">Aventuras</span>
              </h3>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full rounded-2xl overflow-hidden shadow-sm">
            <img src="/images/category_tech.jpg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gear" />
          </div>
        </div>
      </section>

      {/* ─── TENDENCIAS: featured products strip ─── */}
      <section className="max-w-[1400px] mx-auto px-6 mb-20">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-600 block mb-2">
              Lo más popular
            </span>
            <h2 className="text-3xl font-light tracking-tight text-slate-900">
              Tendencias <span className="font-semibold">del momento</span>
            </h2>
          </div>
          <button
            onClick={scrollToCatalog}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors border-b border-slate-300 hover:border-emerald-500 pb-0.5"
          >
            Ver todo el catálogo
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Product grid */}
        {loadingTrending ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-100 rounded-[32px] h-80 animate-pulse"
              />
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
          /* Fallback if API is not reachable */
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-[32px] border border-slate-100">
            <svg className="w-10 h-10 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm font-medium">Explora el catálogo completo en la tienda</p>
            <button
              onClick={scrollToCatalog}
              className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Ir a la tienda →
            </button>
          </div>
        )}
      </section>

      {/* ─── BANNER INTERMEDIO ─── */}
      <section className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12 bg-slate-50 rounded-[40px]">
        <div className="order-2 lg:order-1 relative rounded-[32px] overflow-hidden shadow-sm aspect-[4/3] lg:aspect-square max-h-[500px]">
          <img
            src="/images/banner_laptop_user.jpg"
            alt="Product User Banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="order-1 lg:order-2 space-y-6 lg:pr-12 text-left">
          <span className="text-emerald-600 font-semibold tracking-wider text-xs uppercase">Conecta Contigo</span>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 leading-[1.1]">
            Herramientas <br />
            para <span className="font-semibold">fluir</span> mejor.
          </h2>
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            Equípate para conquistar el día. Diseños ergonómicos, rendimiento tecnológico y materiales de la más alta calidad, fusionados en armonía para acompañar tu ritmo diario sin fricciones.
          </p>
          <button
            onClick={scrollToCatalog}
            className="inline-flex items-center gap-3 text-slate-900 font-semibold border-b-2 border-slate-900 pb-1 hover:text-emerald-600 hover:border-emerald-600 transition-colors"
          >
            Descubrir la colección
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </section>
    </div>
  );
}
