// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE URL BASE SEGÚN ENTORNO
// ═══════════════════════════════════════════════════════════

const WINDOW_LOCATION = typeof window !== 'undefined' ? window.location.origin : 'unknown';
const REQUEST_TIMEOUT = parseInt(process.env.REACT_APP_REQUEST_TIMEOUT || '10000');
const DEBUG = process.env.REACT_APP_DEBUG === 'true';

/**
 * Detecta si está en Codespaces y construye la URL correcta
 * En Codespaces:
 *   - Frontend: https://workspace-3001.app.github.dev
 *   - Backend: https://workspace-3001-8000.app.github.dev (NUEVO) o https://workspace-8000.app.github.dev
 * En localhost:
 *   - Frontend: http://localhost:3001
 *   - Backend: http://localhost:8000/api
 */
let API_BASE_URL = (() => {
  const configUrl = process.env.REACT_APP_API_URL;
  
  // Si hay URL configurada explícitamente, usarla
  if (configUrl && configUrl.startsWith('http')) {
    console.log('[API] Usando URL configurada:', configUrl);
    return configUrl;
  }
  
  // Detectar Codespaces
  const isCodespaces = WINDOW_LOCATION.includes('app.github.dev');
  
  if (isCodespaces) {
    // En Codespaces, construir URL absoluta al backend en puerto 8000
    // El formato típico es: https://codespace-name-3001.app.github.dev
    // Necesitamos cambiar -3001 a -8000
    const backendUrl = WINDOW_LOCATION.replace(/-3001\./, '-8000.');
    console.log('[API] Detectado Codespaces - Usando URL del backend:', backendUrl);
    return `${backendUrl}/api`;
  }
  
  // En localhost o desarrollo local, usar /api relativo
  console.log('[API] Usando URL relativa /api');
  return '/api';
})();

/**
 * Logger para debugging
 */
const log = (type, message, data = null) => {
  if (DEBUG) {
    console.log(`[${type}]`, message, data);
  }
};

/**
 * Error personalizado para requests HTTP
 */
class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Maneja la respuesta HTTP
 */
const handleResponse = async (response, url) => {
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        // Si es HTML (error Django), leer como texto
        const text = await response.text();
        errorData = {
          error: `HTTP Error ${response.status}: ${text.substring(0, 100)}...`,
          isHtml: true
        };
      }
    } catch (e) {
      errorData = { error: `HTTP Error: ${response.status}` };
    }
    
    const errorMsg = errorData.error || `HTTP Error: ${response.status}`;
    log('ERROR', `Request to ${url}`, { status: response.status, message: errorMsg, isHtml: errorData.isHtml });
    throw new APIError(response.status, errorMsg);
  }
  
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // Si no es JSON, retornar el texto como es
    data = await response.text();
  }
  
  log('SUCCESS', `Request to ${url}`, data);
  return data;
};

/**
 * Realiza un fetch con timeout
 */
const fetchWithTimeout = (url, options = {}) => {
  log('FETCH', `Requesting: ${url}`, { method: options.method || 'GET' });
  
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => {
        const timeoutError = new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
        log('ERROR', 'Timeout', { url, timeout: REQUEST_TIMEOUT });
        reject(timeoutError);
      }, REQUEST_TIMEOUT)
    ),
  ]);
};

// Log de inicialización
log('CONFIG', 'API Service Initialized', {
  baseUrl: API_BASE_URL,
  windowOrigin: WINDOW_LOCATION,
  timeout: REQUEST_TIMEOUT,
  debug: DEBUG,
  isRelativeUrl: API_BASE_URL.startsWith('/'),
  environment: process.env.REACT_APP_ENVIRONMENT || 'unknown',
});

// ────────────────────────────────────────────────────
// USUARIO API
// ────────────────────────────────────────────────────

export const userAPI = {
  /**
   * GET /user/<user_id>/profile/
   * Obtiene el perfil de un usuario
   */
  getProfile: async (userId) => {
    const url = `${API_BASE_URL}/user/${userId}/profile/`;
    log('FETCH', 'userAPI.getProfile', { userId, fullUrl: url });
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return handleResponse(response, url);
  },

  /**
   * GET /user/<user_id>/orders/
   * Obtiene todas las órdenes de un usuario
   */
  getOrders: async (userId) => {
    const url = `${API_BASE_URL}/user/${userId}/orders/`;
    log('FETCH', 'userAPI.getOrders', { userId, fullUrl: url });
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return handleResponse(response, url);
  },

  getAllUsers: async () => {
    const url = `${API_BASE_URL}/users/`;
    log('FETCH', 'userAPI.getAllUsers', { fullUrl: url });
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return handleResponse(response, url);
  },
};

// ────────────────────────────────────────────────────
// ÓRDENES API
// ────────────────────────────────────────────────────

export const orderAPI = {
  /**
   * GET /orders/search/<order_id>/
   * Busca una orden por ID (usa GSI1 en DynamoDB)
   */
  getOrderById: async (orderId) => {
    const url = `${API_BASE_URL}/orders/search/${orderId}/`;
    log('FETCH', 'orderAPI.getOrderById', { orderId, fullUrl: url });
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return handleResponse(response, url);
  },

  /**
   * GET /orders/<order_id>/items/
   * Obtiene los ítems de una orden
   * ⚠️ Requiere que el endpoint exista en el backend
   */
  getOrderItems: async (orderId) => {
    const url = `${API_BASE_URL}/orders/${orderId}/items/`;
    log('FETCH', 'orderAPI.getOrderItems', { orderId, fullUrl: url });
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return handleResponse(response, url);
  },
};

export default { userAPI, orderAPI };
