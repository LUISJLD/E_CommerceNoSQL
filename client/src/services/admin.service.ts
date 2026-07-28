import type { Product } from "../shared/types";
import type { Order } from "./orders.service";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("ecommerce_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const adminService = {
  // PRODUCTS
  async createProduct(productData: Partial<Product>, imageFile?: File) {
    let imageUrl = productData.image;

    // Si hay un archivo de imagen, primero obtenemos la presigned URL
    if (imageFile) {
      const urlRes = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: "get_upload_url",
          fileName: imageFile.name,
          fileType: imageFile.type,
        }),
      });

      if (!urlRes.ok) throw new Error("Error obteniendo URL de subida");
      const { uploadUrl, publicUrl } = await urlRes.json();

      // Subimos el archivo a S3 directamente
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });

      if (!uploadRes.ok) throw new Error("Error subiendo la imagen a S3");
      imageUrl = publicUrl;
    }

    // Luego creamos el producto con la URL final
    const res = await fetch(`${API_URL}/admin/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...productData, image: imageUrl }),
    });

    if (!res.ok) throw new Error("Error creando producto");
    return res.json();
  },

  async updateProduct(id: string, productData: Partial<Product>) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error("Error actualizando producto");
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Error eliminando producto");
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Error obteniendo órdenes");
    const json = await res.json();
    return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  },

  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Error actualizando estado de orden");
    return res.json();
  },
};
