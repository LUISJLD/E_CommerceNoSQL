import { useState, useEffect, useCallback } from "react";
import { fetchProducts, createProduct, deleteProduct } from "../../../services/product.service";
import type { Product } from "../../../shared/types";
import { CURRENCY_FORMAT } from "../../../shared/constants";

const CATEGORIES = ["Electrónica", "Ropa", "Deportes", "Hogar"];

const EMPTY_FORM = {
  name: "",
  price: "",
  stock: "",
  category: CATEGORIES[0],
  image: "",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    CURRENCY_FORMAT.locale,
    CURRENCY_FORMAT.options as Intl.NumberFormatOptions
  ).format(value);
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (!form.name.trim() || isNaN(price) || isNaN(stock) || !form.category) {
      setFormError("Nombre, precio, stock y categoría son obligatorios.");
      return;
    }
    setSubmitting(true);
    try {
      await createProduct({
        name: form.name.trim(),
        price,
        stock,
        category: form.category,
        image: form.image.trim(),
      });
      setForm(EMPTY_FORM);
      flash("Producto creado exitosamente.");
      await load();
    } catch {
      setFormError("Error al crear el producto. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    setDeletingId(productId);
    try {
      await deleteProduct(productId);
      flash(`"${name}" eliminado.`);
      await load();
    } catch {
      setError("Error al eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
          <i className="bi bi-shield-lock text-teal-600 text-sm"></i>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Panel de Administración</h2>
          <p className="text-xs text-gray-400">Gestión de productos del catálogo</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">
          <i className="bi bi-check-circle-fill"></i>
          {successMsg}
        </div>
      )}

      {/* Formulario de creación */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <i className="bi bi-plus-circle text-teal-600"></i>
          Nuevo Producto
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Auriculares Bluetooth Z5"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Categoría *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Precio (COP) *</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ej: 850000"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Stock *</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Ej: 10"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">URL de imagen</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {formError && (
            <p className="col-span-2 text-xs text-red-500 flex items-center gap-1">
              <i className="bi bi-exclamation-circle"></i> {formError}
            </p>
          )}

          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <><i className="bi bi-arrow-repeat animate-spin"></i> Guardando...</>
              ) : (
                <><i className="bi bi-plus-lg"></i> Crear Producto</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Catálogo ({products.length} productos)
          </h3>
          <button
            onClick={load}
            className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1 cursor-pointer"
          >
            <i className="bi bi-arrow-clockwise"></i> Recargar
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <i className="bi bi-arrow-repeat text-2xl text-teal-500 animate-spin block"></i>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-400">{error}</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No hay productos en el catálogo.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Producto</th>
                <th className="px-6 py-3 text-left">Categoría</th>
                <th className="px-6 py-3 text-right">Precio</th>
                <th className="px-6 py-3 text-right">Stock</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <img
                      src={p.image || `https://placehold.co/40x40/e2e8f0/64748b?text=${p.name.charAt(0)}`}
                      alt={p.name}
                      className="w-9 h-9 rounded-md object-contain bg-gray-100 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/40x40/e2e8f0/64748b?text=${p.name.charAt(0)}`;
                      }}
                    />
                    <span className="font-medium text-gray-800">{p.name}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{p.category}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">{formatPrice(p.price)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-medium ${p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-orange-500" : "text-gray-700"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {deletingId === p.id ? (
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                      ) : (
                        <><i className="bi bi-trash3 mr-1"></i>Eliminar</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
