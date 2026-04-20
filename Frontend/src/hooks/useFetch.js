import { useState, useEffect } from 'react';

/**
 * Hook personalizado para realización de requests/fetch de datos
 * 
 * @param {Function} fetchFn - Función async que retorna datos
 * @param {Array} dependencies - Array de dependencias para re-ejecutar
 * 
 * @returns {Object} { data, loading, error, retry }
 * 
 * @example
 * const { data: profile, loading, error, retry } = useFetch(
 *   () => userAPI.getProfile(userId),
 *   [userId]
 * );
 */
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Para evitar memory leaks after unmount

    const executeRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();
        
        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError({
            message: err.message || 'Error desconocido',
            status: err.status || null,
            originalError: err,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    executeRequest();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, dependencies);

  /**
   * Reintenta el request manualmente
   */
  const retry = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError({
        message: err.message || 'Error desconocido',
        status: err.status || null,
        originalError: err,
      });
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, retry };
};

export default useFetch;
