import { useState, useEffect, useMemo } from "react";
import type { Product } from "../shared/types";
import { fetchProducts, filterProducts } from "../services/product.service";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => filterProducts(products, query, category),
    [products, query, category]
  );

  return {
    products: filtered,
    loading,
    query,
    setQuery,
    category,
    setCategory,
  };
}
