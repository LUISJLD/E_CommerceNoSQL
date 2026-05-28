import { useState, useEffect, useMemo } from "react";
import type { Product } from "../shared/types";
import { fetchProducts, filterProducts } from "../services/product.service";

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setAllProducts(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterProducts(allProducts, query, category),
    [allProducts, query, category]
  );

  return {
    products: filtered,
    allProducts,       // catálogo completo sin filtrar, para el CartProvider
    loading,
    error,
    query,
    setQuery,
    category,
    setCategory,
  };
}
