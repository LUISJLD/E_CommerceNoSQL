import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../../services/admin.service";
import type { Order } from "../../services/orders.service";
import AdminLayout from "../../layouts/AdminLayout";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search")?.toLowerCase() || "";

  const filteredOrders = orders.filter(o => 
    o.orderId.toLowerCase().includes(searchTerm) || 
    (o.pk && o.pk.toLowerCase().includes(searchTerm)) ||
    (o.status && o.status.toLowerCase().includes(searchTerm))
  );

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await adminService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      // Actualizar localmente para no recargar todo
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
          <p className="text-gray-500 mt-1">Gestiona los pedidos de los clientes</p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ↻ Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No se encontraron órdenes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">ID Orden</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      #{order.orderId.substring(0, 8)}
                      <div className="text-xs text-gray-500 font-normal mt-0.5">
                        {order.pk ? order.pk.replace("USER#", "") : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${order.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "Entregado"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Enviado"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status || "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={order.status || "Pendiente"}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Procesando">Procesando</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
