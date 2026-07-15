import { useState, useEffect, useMemo } from "react";
import type { Product } from "../shared/types";
import { filterProducts } from "../services/product.service";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cacheSource, setCacheSource] = useState<"CACHE" | "DATABASE" | "UNKNOWN">("UNKNOWN");
  const [responseTime, setResponseTime] = useState(0);

  useEffect(() => {
    const start = performance.now();
    fetch(`${API_URL}/products`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        const elapsed = Math.round(performance.now() - start);
        setResponseTime(elapsed);

        const source = json?.source;
        setCacheSource(
          source === "CACHE" ? "CACHE" : source === "DATABASE" ? "DATABASE" : "UNKNOWN"
        );

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
      })
      .then((data) => {
        setAllProducts(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterProducts(allProducts, query, category),
    [allProducts, query, category]
  );

  return {
    products: filtered,
    allProducts,
    loading,
    error,
    query,
    setQuery,
    category,
    setCategory,
    cacheSource,
    responseTime,
  };
}
