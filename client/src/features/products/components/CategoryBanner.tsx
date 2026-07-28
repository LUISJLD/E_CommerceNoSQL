import { useState, useEffect } from "react";

interface CategoryBannerProps {
  category?: string | null;
}

const BANNERS = [
  {
    image: "/images/banner_todos.jpg",
    title: "Descubre Tu Estilo",
    subtitle: "Colecciones exclusivas para destacar en cada momento.",
    tag: "Novedades"
  },
  {
    image: "/images/banner_electronica.jpg",
    title: "Innovación Tecnológica",
    subtitle: "Descubre nuestra selección premium de dispositivos.",
    tag: "Tecnología"
  },
  {
    image: "/images/hero_lifestyle.jpg",
    title: "Tu Espacio, Tu Santuario",
    subtitle: "Equipa tu vida con los mejores accesorios y comodidades.",
    tag: "Estilo de Vida"
  },
  {
    image: "/images/banner_equipamiento.jpg",
    title: "Rendimiento y Acción",
    subtitle: "Supera tus límites diarios con equipamiento de primer nivel.",
    tag: "Deportes"
  },
  {
    image: "/images/banner_apparel.jpg",
    title: "Estilo & Vanguardia",
    subtitle: "Moda de alta calidad que se adapta a tu esencia.",
    tag: "Moda"
  }
];

export default function CategoryBanner(_props: CategoryBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[240px] md:h-[300px] relative rounded-[32px] overflow-hidden mb-8 shadow-sm group">
      {BANNERS.map((banner, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background Image */}
          <img
            src={banner.image}
            alt={banner.title}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[6s] ease-out ${
              idx === currentIndex ? "scale-105" : "scale-100"
            }`}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 text-white pointer-events-none">
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-4 w-max backdrop-blur-sm">
              {banner.tag}
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 md:mb-4 drop-shadow-md">
              {banner.title}
            </h1>
            <p className="text-sm md:text-base text-slate-200 font-medium max-w-lg drop-shadow-md leading-relaxed">
              {banner.subtitle}
            </p>
          </div>
        </div>
      ))}
      
      {/* Carousel Indicators */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-20">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex ? "w-8 bg-emerald-400" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Ir al banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
