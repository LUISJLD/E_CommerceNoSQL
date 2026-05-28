export const CATEGORIES: readonly string[] = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Accesorios",
  "General",
];

export const CURRENCY_FORMAT = {
  locale: "es-CO",
  options: {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  },
} as const;
