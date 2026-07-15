import { useState, useEffect } from "react";
import { fetchUserOrders, fetchOrderItems } from "../../../services/orders.service";
import type { Order, OrderItem } from "../../../services/orders.service";
import { CURRENCY_FORMAT } from "../../../shared/constants";

// Estado y estilos de pedidos
const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  DELIVERED:  { label: "Entregado",  classes: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  SHIPPED:    { label: "Enviado",    classes: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  PROCESSING: { label: "Procesando", classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  CANCELLED:  { label: "Cancelado",  classes: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  PENDING:    { label: "Pendiente",  classes: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
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
    classes: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.classes}`}>
      {style.label}
    </span>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 font-sans">
      <div>
        <p className="text-sm font-semibold text-slate-200">{item.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {item.qty} × {formatPrice(item.price)}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-100">
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
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-400/30 transition-all">
      {/* Header de la orden */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-white/5 transition-colors"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0 text-slate-400">
            <i className="bi bi-box-seam text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Pedido #{orderId.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status={order.status} />
          <p className="text-sm font-bold text-white min-w-[80px] text-right">
            {formatPrice(order.total)}
          </p>
          <i
            className={`bi bi-chevron-down text-slate-400 text-xs transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          ></i>
        </div>
      </button>

      {/* Detalle expandible */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-white/5 bg-slate-950/20">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">
            Productos
          </p>
          {loadingItems ? (
            <p className="text-xs text-slate-400 py-2">Cargando...</p>
          ) : itemsError ? (
            <p className="text-xs text-rose-400 py-2">{itemsError}</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Sin productos registrados.</p>
          ) : (
            <div className="divide-y divide-white/5">
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

  const loadOrders = () => {
    setLoading(true);
    setError(null);
    fetchUserOrders(userId)
      .then(({ orders, cacheSource, responseTime }) => {
        setOrders(orders);
        setCacheSource(cacheSource);
        setResponseTime(responseTime);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
            <i className="bi bi-arrow-repeat text-2xl text-indigo-400 animate-spin block"></i>
          </div>
          <p className="text-sm font-semibold text-slate-300">Cargando pedidos...</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Si es la primera vez que abres esta sección, el servidor puede tardar unos segundos en arrancar.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
            <i className="bi bi-exclamation-circle text-2xl text-rose-400 block"></i>
          </div>
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <p className="text-xs text-slate-500">El backend puede estar iniciando. Vuelve a intentarlo.</p>
          <button
            onClick={loadOrders}
            className="px-4 py-2 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition cursor-pointer"
          >
            <i className="bi bi-arrow-clockwise mr-1.5"></i> Reintentar
          </button>
        </div>
      </div>
    );
  }

  const badgeClass =
    cacheSource === "CACHE"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : cacheSource === "DATABASE"
      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      : "bg-slate-500/10 text-slate-500 border border-slate-500/20";

  return (
    <div className="flex-1 font-sans">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Mis Pedidos</h2>
          <p className="text-xs text-slate-400 mt-1">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cacheSource !== "UNKNOWN" && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
              {cacheSource === "CACHE" ? "⚡ Redis Cache" : "🗄️ DynamoDB"}
            </span>
          )}
          {responseTime > 0 && (
            <span className="text-xs font-medium text-slate-400 font-mono">⏱ {responseTime} ms</span>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <i className="bi bi-bag-x text-2xl"></i>
          </div>
          <p className="text-sm font-semibold text-slate-300">No tienes pedidos aún</p>
          <p className="text-xs text-slate-500 mt-1.5">
            Cuando realices una compra, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => (
            <OrderCard key={order.sk || order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
