import React, { useState, useEffect } from 'react';
import './APIStatus.css';

/**
 * Componente para diagnosticar la configuración de la API
 * Muestra: URL detectada, origen del frontend, petición de prueba
 */
export const APIStatus = () => {
  const [status, setStatus] = useState('checking');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        // Obtener la URL desde window (debería estar en localStorage o ser accesible)
        const windowOrigin = window.location.origin;
        const apiBaseUrl = (() => {
          const isCodespaces = windowOrigin.includes('app.github.dev');
          if (isCodespaces) {
            return windowOrigin.replace(/-3001\./, '-8000.') + '/api';
          }
          return '/api';
        })();

        const testUrl = `${apiBaseUrl}/user/luisa/profile/`;
        
        setData({
          frontendOrigin: windowOrigin,
          apiBaseUrl,
          testUrl,
          isCodespaces: windowOrigin.includes('app.github.dev'),
          environment: process.env.REACT_APP_ENVIRONMENT || 'unknown',
        });

        // Intentar petición de prueba
        const response = await fetch(testUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setError(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    };

    checkAPI();
  }, []);

  if (!data) return null;

  return (
    <div className={`api-status api-status--${status}`}>
      <h3>🔍 API Status Check</h3>
      <ul>
        <li><strong>Frontend Origin:</strong> <code>{data.frontendOrigin}</code></li>
        <li><strong>API Base URL:</strong> <code>{data.apiBaseUrl}</code></li>
        <li><strong>Is Codespaces:</strong> {data.isCodespaces ? '✅ Sí' : '❌ No'}</li>
        <li><strong>Environment:</strong> <code>{data.environment}</code></li>
        <li><strong>Test URL:</strong> <code>{data.testUrl}</code></li>
        {error && <li className="error"><strong>Error:</strong> {error}</li>}
      </ul>
      <p className={`status-message status-message--${status}`}>
        {status === 'checking' && '⏳ Verificando...'}
        {status === 'success' && '✅ API accesible'}
        {status === 'error' && `❌ Error conectando: ${error}`}
      </p>
    </div>
  );
};

export default APIStatus;
