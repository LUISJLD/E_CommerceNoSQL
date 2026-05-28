import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../../services/admin.service";
import { fetchProducts } from "../../services/product.service";
import type { Order } from "../../services/orders.service";
import AdminLayout from "../../layouts/AdminLayout";
import { DollarSign, ShoppingCart, Clock, Package } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search")?.toLowerCase() || "";

  useEffect(() => {
    async function loadStats() {
      try {
        const [products, orders] = await Promise.all([
          fetchProducts(),
          adminService.getOrders(),
        ]);

        const pending = orders.filter((o) => o.status !== "Entregado");
        const revenue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          pendingOrders: pending.length,
          revenue,
        });
        
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error("Error loading stats", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del rendimiento de tu tienda</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tarjeta 1: Ingresos */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 shadow-sm border border-green-100 flex flex-col">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <DollarSign size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Ingresos (Hoy)</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">${stats.revenue.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 mb-3 h-1.5 w-full bg-green-100 rounded-full overflow-hidden flex items-center">
                 <div className="h-full bg-blue-500" style={{ width: stats.revenue > 0 ? '75%' : '0%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-auto">
                {stats.revenue > 0 ? "¡Excelente! Has registrado ingresos." : "Aún no se registran ventas hoy."}
              </p>
            </div>

            {/* Tarjeta 2: Órdenes Totales */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 shadow-sm border border-blue-100 flex flex-col">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <ShoppingCart size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Órdenes Totales <span className="text-xs font-normal">(Mes)</span></h3>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalOrders}</p>
                </div>
              </div>
              <div className="mt-4 mb-3 flex items-end gap-1.5 h-8">
                 {[40, 60, 30, 80, 50, 40, 70].map((h, i) => (
                    <div key={i} className={`w-full rounded-sm ${stats.totalOrders > 0 ? 'bg-blue-200' : 'bg-gray-200'}`} style={{ height: `${stats.totalOrders > 0 ? h : 10}%` }}></div>
                 ))}
              </div>
              <p className="text-xs text-gray-500 mt-auto">
                {stats.totalOrders > 0 ? `Tienes ${stats.totalOrders} órdenes en total.` : "Sin órdenes registradas."}
              </p>
            </div>

            {/* Tarjeta 3: Órdenes Pendientes */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-5 shadow-sm border border-orange-100 flex flex-col">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Clock size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Órdenes Pendientes</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.pendingOrders}</p>
                </div>
              </div>
              <div className="mt-4 mb-3 flex justify-center h-8">
                 <svg viewBox="0 0 36 36" className={`h-full w-auto ${stats.pendingOrders > 0 ? 'text-orange-400' : 'text-gray-300'}`}>
                    <path className="fill-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="100, 100" />
                 </svg>
              </div>
              <p className="text-xs text-gray-500 mt-auto">
                {stats.pendingOrders > 0 ? `Tienes ${stats.pendingOrders} órdenes por procesar.` : "Toda la cadena está al día."}
              </p>
            </div>

            {/* Tarjeta 4: Productos */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Package size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Productos</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalProducts}</p>
                </div>
              </div>
              <div className="mt-4 mb-3 flex flex-col gap-2 h-8 justify-end">
                 <div className="flex items-center gap-2"><div className={`h-1.5 rounded-sm w-3/4 ${stats.totalProducts > 0 ? 'bg-purple-200' : 'bg-gray-200'}`}></div></div>
                 <div className="flex items-center gap-2"><div className={`h-1.5 rounded-sm w-1/2 ${stats.totalProducts > 0 ? 'bg-purple-200' : 'bg-gray-200'}`}></div></div>
                 <div className="flex items-center gap-2"><div className={`h-1.5 rounded-sm w-full ${stats.totalProducts > 0 ? 'bg-purple-200' : 'bg-gray-200'}`}></div></div>
              </div>
              <p className="text-xs text-gray-500 mt-auto">
                {stats.totalProducts > 0 ? `Tienes ${stats.totalProducts} productos en tu catálogo.` : "Agrega tu primer producto."}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {/* Últimas Órdenes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Últimas Órdenes</h2>
              </div>
              <div className="flex-1 p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                    <tr>
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-500">
                    {recentOrders.filter(o => 
                      o.orderId.toLowerCase().includes(searchTerm) || 
                      (o.pk && o.pk.toLowerCase().includes(searchTerm)) ||
                      (o.status && o.status.toLowerCase().includes(searchTerm))
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center">No se encontraron datos</td>
                      </tr>
                    ) : (
                      recentOrders.filter(o => 
                        o.orderId.toLowerCase().includes(searchTerm) || 
                        (o.pk && o.pk.toLowerCase().includes(searchTerm)) ||
                        (o.status && o.status.toLowerCase().includes(searchTerm))
                      ).map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">
                            #{order.orderId.substring(0, 8)}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {order.pk ? order.pk.replace("USER#", "") : "Cliente Anónimo"}
                          </td>
                          <td className="px-5 py-3">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Hoy"}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              order.status === "Entregado" ? "bg-green-100 text-green-700" :
                              order.status === "Enviado" ? "bg-blue-100 text-blue-700" :
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {order.status || "Pendiente"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">
                            ${order.total.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
