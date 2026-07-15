import type { Product } from "../shared/types";

// URL del API Gateway - usada por todas las integraciones
const API_URL =
  import.meta.env.VITE_API_URL || "/api";

/**
 * La Lambda de productos retorna: { source: "CACHE" | "DATABASE", data: [...] }
 */
export async function fetchProducts(category?: string): Promise<Product[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${API_URL}/products${params}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status} fetching products`);
  }

  const json = await res.json();
  // La Lambda ahora retorna { source: "CACHE"|"DATABASE", data: [...] }
  // Soportamos ambas formas por compatibilidad
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

export function filterProducts(
  products: Product[],
  query: string,
  category: string | null
): Product[] {
  return products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesQuery && matchesCategory;
  });
}
