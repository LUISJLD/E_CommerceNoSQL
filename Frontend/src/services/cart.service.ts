// src/services/cart.service.ts

// URL del API Gateway - usada por todas las integraciones
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface CartItem {
    productId: string;
    qty: number;
    price: number;
}

/**
 * 🔍 GET - Obtiene el carrito del usuario (Estrategia Cache-Aside)
 */
export async function getUserCart(userId: string): Promise<CartItem[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}`);

        if (!response.ok) {
            throw new Error(`Error al obtener el carrito: ${response.statusText}`);
        }

        return await response.json(); // Retorna el array de productos []
    } catch (error) {
        console.error("Error en getUserCart Service:", error);
        throw error;
    }
}

/**
 * 🛒 POST - Agrega o actualiza un producto en el carrito (Persiste en DynamoDB e invalida Redis)
 */
export async function addProductToCart(userId: string, item: CartItem): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(item),
        });

        if (!response.ok) {
            throw new Error(`Error al agregar producto: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en addProductToCart Service:", error);
        throw error;
    }
}

/**
 * 🧼 DELETE - Remueve un producto específico del carrito usando Query Parameters
 */
export async function removeProductFromCart(userId: string, productId: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}?productId=${productId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar producto: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en removeProductFromCart Service:", error);
        throw error;
    }
}