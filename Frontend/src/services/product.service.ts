import type { Product } from "../shared/types";

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Teléfono Inteligente X100",
    price: 850000,
    stock: 15,
    image: "https://placehold.co/200x200/e8f5e9/333?text=Phone",
    category: "Electrónica",
  },
  {
    id: "2",
    name: "Portátil WorkPro 15",
    price: 2200000,
    stock: 8,
    image: "https://placehold.co/200x200/e3f2fd/333?text=Laptop",
    category: "Electrónica",
  },
  {
    id: "3",
    name: "Auriculares Bluetooth Z5",
    price: 120000,
    stock: 25,
    image: "https://placehold.co/200x200/f3e5f5/333?text=Headphones",
    category: "Electrónica",
  },
  {
    id: "4",
    name: "Reloj Inteligente FitTrack",
    price: 350000,
    stock: 3,
    image: "https://placehold.co/200x200/fff3e0/333?text=Watch",
    category: "Electrónica",
  },
  {
    id: "5",
    name: "Mochila de Viaje",
    price: 90000,
    stock: 50,
    image: "https://placehold.co/200x200/efebe9/333?text=Backpack",
    category: "Deportes",
  },
  {
    id: "6",
    name: "Camiseta Algodón Hombre",
    price: 45000,
    stock: 100,
    image: "https://placehold.co/200x200/fce4ec/333?text=T-Shirt",
    category: "Ropa",
  },
];

export async function fetchProducts(): Promise<Product[]> {
  return MOCK_PRODUCTS;
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
