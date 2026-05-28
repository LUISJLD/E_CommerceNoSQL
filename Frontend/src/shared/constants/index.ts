export const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Categorías", href: "/categorias" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Marcas", href: "/marcas" },
] as const;

export const CATEGORIES: readonly string[] = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
];

export const CURRENCY_FORMAT = {
  locale: "es-CO",
  options: {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  },
} as const;
