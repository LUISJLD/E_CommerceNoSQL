import React from 'react';
import './ErrorAlert.css';

export default function ErrorAlert({ error, onRetry }) {
  const errorInfo = getErrorInfo(error);

  return (
    <div className="error-alert">
      <div className="error-alert__icon-wrap">
        <div className="error-alert__icon">{errorInfo.icon}</div>
      </div>
      <div className="error-alert__content">
        <div className="error-alert__tag">Ups · Algo salió mal</div>
        <h3 className="error-alert__title">{errorInfo.title}</h3>
        <p className="error-alert__message">{errorInfo.message}</p>
        {error?.status && (
          <div className="error-alert__meta">
            <span className="error-alert__status-tag">HTTP {error.status}</span>
          </div>
        )}
        {onRetry && (
          <button className="error-alert__button" onClick={onRetry}>
            <span>↻</span> Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

function getErrorInfo(error) {
  const status = error?.status;
  const message = error?.message?.toLowerCase() || '';

  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    !navigator.onLine
  ) {
    return {
      icon: '🔌',
      title: 'Sin conexión con el servidor',
      message: 'No pudimos conectar con el backend. Verifica que el servidor esté corriendo o revisa tu conexión a internet.',
    };
  }

  if (message.includes('timeout')) {
    return {
      icon: '⏱',
      title: 'La solicitud tardó demasiado',
      message: 'El servidor está tardando más de lo esperado. Puede estar sobrecargado o no disponible. Intenta de nuevo.',
    };
  }

  if (status === 404) {
    return {
      icon: '🔍',
      title: 'Información no encontrada',
      message: 'No encontramos lo que buscabas. Es posible que el recurso haya sido eliminado o la URL no sea correcta.',
    };
  }

  if (status === 401 || status === 403) {
    return {
      icon: '🔒',
      title: 'Acceso no autorizado',
      message: 'No tienes permisos para acceder a este recurso. Verifica tus credenciales.',
    };
  }

  if (status >= 500) {
    return {
      icon: '💥',
      title: 'Error del servidor',
      message: 'Algo falló en el backend mientras procesaba tu petición. Intenta de nuevo en unos momentos.',
    };
  }

  return {
    icon: '⚠',
    title: 'Algo salió mal',
    message: error?.message || 'Ocurrió un error inesperado al procesar tu solicitud. Intenta de nuevo.',
  };
}