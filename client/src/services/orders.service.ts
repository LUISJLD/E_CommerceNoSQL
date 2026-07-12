// URL del API Gateway - usada por todas las integraciones
const API_URL =
  import.meta.env.VITE_API_URL || "/api";

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado. Verifica que el backend esté activo.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export interface Order {
  pk?: string;
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

export interface OrdersResult {
  orders: Order[];
  cacheSource: "CACHE" | "DATABASE" | "UNKNOWN";
  responseTime: number;
}

/**
 * POST /orders
 * Crea una nueva orden a partir del carrito guardado en Redis.
 */
export async function createOrder(userId: string): Promise<{ orderId: string, total: number }> {
  const token = localStorage.getItem('ecommerce_token');
  const res = await fetchWithTimeout(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ userId }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status} al crear orden`);
  }

  return res.json();
}

/**
 * GET /user/{userId}/orders
 */
export async function fetchUserOrders(userId: string): Promise<OrdersResult> {
  const start = performance.now();
  const token = localStorage.getItem('ecommerce_token');
  const res = await fetchWithTimeout(`${API_URL}/user/${encodeURIComponent(userId)}/orders`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  const elapsed = Math.round(performance.now() - start);
  if (!res.ok) throw new Error(`Error ${res.status} fetching orders`);

  const src = res.headers.get("X-Cache-Source");
  const cacheSource: "CACHE" | "DATABASE" | "UNKNOWN" =
    src === "CACHE" ? "CACHE" : src === "DATABASE" ? "DATABASE" : "UNKNOWN";

  const json = await res.json();
  const items: Record<string, unknown>[] = Array.isArray(json) ? json : [];

  return {
    orders: items.map((item) => ({
      orderId: (item.orderId as string) ?? (item.sk as string)?.replace("ORDER#", "") ?? "",
      status: (item.status as string) ?? "UNKNOWN",
      total: Number(item.total ?? 0),
      createdAt: (item.createdAt as string) ?? (item.created_at as string) ?? "",
      sk: (item.sk as string) ?? "",
    })),
    cacheSource,
    responseTime: elapsed,
  };
}

/**
 * GET /orders/{orderId}/items
 * La Lambda retorna un array directo.
 */
export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const token = localStorage.getItem('ecommerce_token');
  const res = await fetchWithTimeout(`${API_URL}/orders/${encodeURIComponent(orderId)}/items`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
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
