import { useState, useEffect } from "react";
import { fetchUserOrders, fetchOrderItems } from "../../../services/orders.service";
import type { Order, OrderItem } from "../../../services/orders.service";
import { CURRENCY_FORMAT } from "../../../shared/constants";

// Estado y estilos de pedidos
const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  DELIVERED:  { label: "Entregado",  classes: "bg-green-100 text-green-700" },
  SHIPPED:    { label: "Enviado",    classes: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Procesando", classes: "bg-yellow-100 text-yellow-700" },
  CANCELLED:  { label: "Cancelado",  classes: "bg-red-100 text-red-600" },
  PENDING:    { label: "Pendiente",  classes: "bg-gray-100 text-gray-600" },
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(value);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toUpperCase()] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${style.classes}`}>
      {style.label}
    </span>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{item.name}</p>
        <p className="text-xs text-gray-400">
          {item.qty} × {formatPrice(item.price)}
        </p>
      </div>
      <p className="text-sm font-semibold text-gray-900">
        {formatPrice(item.price * item.qty)}
      </p>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const orderId = order.orderId || order.sk.replace("ORDER#", "");

  const handleToggle = async () => {
    if (!expanded && items.length === 0) {
      setLoadingItems(true);
      setItemsError(null);
      try {
        const data = await fetchOrderItems(orderId);
        setItems(data);
      } catch (e) {
        setItemsError("No se pudieron cargar los productos.");
      } finally {
        setLoadingItems(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header de la orden */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
            <i className="bi bi-box-seam text-teal-600 text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Pedido #{orderId.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status={order.status} />
          <p className="text-sm font-bold text-gray-900 min-w-[80px] text-right">
            {formatPrice(order.total)}
          </p>
          <i
            className={`bi bi-chevron-down text-gray-400 text-xs transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          ></i>
        </div>
      </button>

      {/* Detalle expandible */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">
            Productos
          </p>
          {loadingItems ? (
            <p className="text-sm text-gray-400 py-2">Cargando...</p>
          ) : itemsError ? (
            <p className="text-sm text-red-400 py-2">{itemsError}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Sin productos registrados.</p>
          ) : (
            <div>
              {items.map((item) => (
                <OrderItemRow key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersView({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheSource, setCacheSource] = useState<"CACHE" | "DATABASE" | "UNKNOWN">("UNKNOWN");
  const [responseTime, setResponseTime] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchUserOrders(userId)
      .then(({ orders, cacheSource, responseTime }) => {
        setOrders(orders);
        setCacheSource(cacheSource);
        setResponseTime(responseTime);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <i className="bi bi-arrow-repeat text-3xl text-teal-500 animate-spin block mb-3"></i>
          <p className="text-sm text-gray-400">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <i className="bi bi-exclamation-circle text-3xl text-red-400 block mb-3"></i>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mis Pedidos</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cacheSource !== "UNKNOWN" && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              cacheSource === "CACHE"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300"
            }`}>
              {cacheSource === "CACHE" ? "⚡ Redis Cache" : "🗄️ DynamoDB"}
            </span>
          )}
          {responseTime > 0 && (
            <span className="text-xs text-gray-400">{responseTime} ms</span>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <i className="bi bi-bag-x text-2xl text-gray-400"></i>
          </div>
          <p className="text-sm font-medium text-gray-600">No tienes pedidos aún</p>
          <p className="text-xs text-gray-400 mt-1">
            Cuando realices una compra, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.sk || order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
