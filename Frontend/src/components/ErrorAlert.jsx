import React from 'react';
import './ErrorAlert.css';

/**
 * Componente de alerta de error
 * 
 * @param {Object} error - Objeto error { message, status }
 * @param {Function} onRetry - Callback para reintentar
 */
export default function ErrorAlert({ error, onRetry }) {
  return (
    <div className="error-alert">
      <div className="error-alert__icon">⚠️</div>
      <div className="error-alert__content">
        <h3 className="error-alert__title">Error al cargar datos</h3>
        <p className="error-alert__message">
          {error?.message || 'Error desconocido'}
        </p>
        {error?.status && (
          <p className="error-alert__status">HTTP {error.status}</p>
        )}
      </div>
      {onRetry && (
        <button className="error-alert__button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
