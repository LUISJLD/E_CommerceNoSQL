import type { Product } from "../shared/types";

const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * La Lambda de productos retorna: { source: "CACHE" | "DATABASE", data: [...] }
 */
export async function fetchProducts(category?: string): Promise<Product[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${API_URL}/products${params}`);

  if (!res.ok) throw new Error(`Error ${res.status} fetching products`);

  const json = await res.json();
  const items: Record<string, unknown>[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
    ? json.data
    : [];

  return items.map((item) => ({
    id: item.productId as string,
    name: item.name as string,
    price: Number(item.price),
    stock: Number(item.stock),
    image: item.image as string,
    category: item.category as string,
  }));
}

export async function createProduct(data: {
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}): Promise<{ productId: string }> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error ${res.status} creating product`);
  return res.json();
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Error ${res.status} deleting product`);
}

/**
 * PriceRange is a [min, max] tuple in whole-dollar units.
 * A null value on either side means "no bound".
 * Default state: [null, null] = show all prices.
 */
export type PriceRange = [number | null, number | null];

export type SortBy = "default" | "price_asc" | "price_desc" | "name_asc";

export function filterProducts(
  products: Product[],
  query: string,
  category: string | null,
  priceRange: PriceRange = [null, null],
  sortBy: SortBy = "default"
): Product[] {
  const [minPrice, maxPrice] = priceRange;

  let result = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || p.category === category;
    const matchesMin = minPrice === null || p.price >= minPrice;
    const matchesMax = maxPrice === null || p.price <= maxPrice;
    return matchesQuery && matchesCategory && matchesMin && matchesMax;
  });

  if (sortBy === "price_asc") {
    result = [...result].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    result = [...result].sort((a, b) => b.price - a.price);
  } else if (sortBy === "name_asc") {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}

/** Derive the natural price bounds from the loaded product catalog. */
export function getPriceBounds(products: Product[]): [number, number] {
  if (products.length === 0) return [0, 500];
  const prices = products.map((p) => p.price);
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}
