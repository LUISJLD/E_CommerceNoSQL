import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../../services/admin.service";
import { fetchProducts } from "../../services/product.service";
import type { Product } from "../../shared/types";
import AdminLayout from "../../layouts/AdminLayout";
import { ImagePlus } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search")?.toLowerCase() || "";

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) || 
    p.category.toLowerCase().includes(searchTerm)
  );

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products", error);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(product?: Product) {
    setEditingProduct(product || null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await adminService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Error eliminando producto");
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Gestiona el catálogo de tu tienda</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No se encontraron productos</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Imagen</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200" />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">${product.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-900 font-medium transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 font-medium transition-colors">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={async () => {
            await loadProducts();
            handleCloseModal();
          }}
        />
      )}
    </AdminLayout>
  );
}

// Subcomponente: Formulario Modal para Crear/Editar Producto
function ProductModal({ product, onClose, onSave }: { product: Product | null, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "General",
    price: product?.price || 0,
    stock: product?.stock || 0,
    image: product?.image || "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(product?.image || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!product;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreview(URL.createObjectURL(file)); // Preview local
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        // Por simplicidad, si estamos editando y cambian la foto, usamos la misma lógica de S3
        // Pero el backend de updateProduct actualmente no pide 'action: get_upload_url', 
        // así que si se cambia la imagen en edit, crearemos un create temporal o pedimos url
        // En nuestro adminService el create maneja S3. Podemos adaptarlo o solo actualizar textos en edit
        
        // Si hay archivo nuevo en Edición, primero subimos la imagen usando una llamada custom al admin.service o reusamos create lógica:
        let finalImage = formData.image;
        if (imageFile) {
           // Hack para reutilizar el generador de presigned URL de createProduct
           const res = await fetch(import.meta.env.VITE_API_URL + "/admin/products", {
             method: "POST",
             headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("ecommerce_token")}` },
             body: JSON.stringify({ action: "get_upload_url", fileName: imageFile.name, fileType: imageFile.type })
           });
           const { uploadUrl, publicUrl } = await res.json();
           await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": imageFile.type }, body: imageFile });
           finalImage = publicUrl;
        }

        await adminService.updateProduct(product.id, { ...formData, image: finalImage });
      } else {
        // Creación
        await adminService.createProduct(formData, imageFile || undefined);
      }
      onSave();
    } catch (err) {
      alert("Error guardando el producto. Revisa la consola.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Editar Producto" : "Nuevo Producto"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload Area */}
            <div className="flex justify-center">
              <div 
                className="relative w-40 h-40 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden group cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <ImagePlus className="w-10 h-10 mb-2 text-blue-500 opacity-80" strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-center px-4">Subir Imagen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Cambiar</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
            
            {/* OR URL Fallback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">O escribe la URL de la imagen (Opcional si no subes archivo)</label>
              <input type="text" value={formData.image} onChange={(e) => { setFormData({...formData, image: e.target.value}); setPreview(e.target.value); }} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select 
                  required 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="" disabled>Seleccione una categoría</option>
                  <option value="General">General</option>
                  <option value="Electrónica">Electrónica</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($) *</label>
                <input required type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Disponible *</label>
                <input required type="number" min="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="productForm" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70 flex items-center gap-2">
            {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {isEditing ? "Guardar Cambios" : "Crear Producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
