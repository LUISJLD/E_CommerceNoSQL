import { useState, useEffect } from "react";
import { fetchUserOrders, fetchOrderItems } from "../../../services/orders.service";
import type { Order, OrderItem } from "../../../services/orders.service";
import { CURRENCY_FORMAT } from "../../../shared/constants";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  DELIVERED:  { label: "Entregado",  classes: "bg-green-100 text-green-700" },
  SHIPPED:    { label: "Enviado",    classes: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Procesando", classes: "bg-yellow-100 text-yellow-700" },
  CANCELLED:  { label: "Cancelado",  classes: "bg-red-100 text-red-600" },
  PENDING:    { label: "Pendiente",  classes: "bg-gray-100 text-gray-600" },
};

export function normalizeStatus(status: string) {
  if (!status) return "PENDING";
  const s = status.toUpperCase();
  if (s === "ENTREGADO") return "DELIVERED";
  if (s === "ENVIADO") return "SHIPPED";
  if (s === "PROCESANDO") return "PROCESSING";
  if (s === "CANCELADO") return "CANCELLED";
  if (s === "PENDIENTE") return "PENDING";
  return s;
}

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
  const norm = normalizeStatus(status);
  const style = STATUS_STYLES[norm] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded ${style.classes}`}>
      {style.label}
    </span>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 text-left">
      <div>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{item.name}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
          {item.qty} × {formatPrice(item.price)}
        </p>
      </div>
      <p className="text-xs font-black text-slate-900">
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
    <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden hover:shadow-md transition-all">
      {/* Header de la orden */}
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
              Pedido #{orderId.slice(-8).toUpperCase()}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status={order.status} />
          <p className="text-sm font-black text-slate-900 min-w-[80px] text-right tracking-tight">
            {formatPrice(order.total)}
          </p>
          <span className={`text-[10px] font-black text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Detalle expandible */}
      {expanded && (
        <div className="px-6 pb-5 border-t border-slate-50 bg-slate-50/30">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 text-left">
            Artículos Comprados
          </p>
          {loadingItems ? (
            <p className="text-xs font-bold text-slate-400 py-2">Cargando...</p>
          ) : itemsError ? (
            <p className="text-xs font-bold text-rose-500 py-2">{itemsError}</p>
          ) : items.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 py-2">Sin productos registrados.</p>
          ) : (
            <div className="divide-y divide-slate-100">
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

export default function OrdersView({ userId, searchQuery = "" }: { userId: string, searchQuery?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheSource, setCacheSource] = useState<"CACHE" | "DATABASE" | "UNKNOWN">("UNKNOWN");
  const [responseTime, setResponseTime] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <svg className="animate-spin h-6 w-6 text-slate-900 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-slate-400 uppercase tracking-widest font-black">Cargando Historial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center text-rose-500 font-bold text-xs uppercase tracking-widest">
          Error: {error}
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter && normalizeStatus(o.status) !== statusFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const orderId = (o.orderId || o.sk.replace("ORDER#", "")).toLowerCase();
      if (orderId.includes(query)) return true;
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-sm font-black tracking-widest uppercase text-slate-900">Mis Pedidos</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            {orders.length} {orders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cacheSource !== "UNKNOWN" && (
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
              cacheSource === "CACHE"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }`}>
              {cacheSource === "CACHE" ? "Redis Cache" : "MongoDB Atlas"}
            </span>
          )}
          {responseTime > 0 && (
            <span className="text-[10px] font-bold text-slate-400">{responseTime} ms</span>
          )}
        </div>
      </div>

      {/* Filtros de Estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
            statusFilter === null
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          Todos
        </button>
        {Object.entries(STATUS_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
              statusFilter === key
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-slate-100/50 p-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm text-slate-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {statusFilter ? "No hay pedidos con este estado" : "No tienes pedidos aún"}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">
            {statusFilter ? "Intenta seleccionar otro estado de pedido." : "Cuando realices una compra, aparecerá registrada en esta sección."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.sk || order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
