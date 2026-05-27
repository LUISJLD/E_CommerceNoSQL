// URL del API Gateway - usada por todas las integraciones
const API_URL =
  import.meta.env.VITE_API_URL || "/api";

export interface Order {
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  sk: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

/**
 * GET /user/{userId}/orders
 * La Lambda retorna un array directo.
 */
export async function fetchUserOrders(userId: string): Promise<Order[]> {
  const res = await fetch(`${API_URL}/user/${userId}/orders`);
  if (!res.ok) throw new Error(`Error ${res.status} fetching orders`);

  const json = await res.json();
  const items: Record<string, unknown>[] = Array.isArray(json) ? json : [];

  return items.map((item) => ({
    orderId: (item.orderId as string) ?? (item.sk as string)?.replace("ORDER#", "") ?? "",
    status: (item.status as string) ?? "UNKNOWN",
    total: Number(item.total ?? 0),
    createdAt: (item.createdAt as string) ?? (item.created_at as string) ?? "",
    sk: (item.sk as string) ?? "",
  }));
}

/**
 * GET /orders/{orderId}/items
 * La Lambda retorna un array directo.
 */
export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const res = await fetch(`${API_URL}/orders/${orderId}/items`);
  if (!res.ok) throw new Error(`Error ${res.status} fetching order items`);

  const json = await res.json();
  const items: Record<string, unknown>[] = Array.isArray(json) ? json : [];

  return items.map((item) => ({
    productId: (item.productId as string) ?? (item.sk as string)?.replace("ITEM#", "") ?? "",
    name: (item.name as string) ?? (item.productId as string) ?? "Producto",
    qty: Number(item.qty ?? item.quantity ?? 1),
    price: Number(item.price ?? 0),
  }));
}
