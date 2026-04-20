import React from 'react';
import './LoadingSpinner.css';

/**
 * Componente de indicador de carga
 * 
 * @param {string} message - Mensaje a mostrar mientras carga
 */
export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}
