import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { userAPI } from '../services/api';
import './Usuario.css';

export default function Usuario() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await userAPI.getAllUsers();
      setUsers(Array.isArray(items) ? items : []);
    } catch (err) {
      setError({
        message: 'Error al cargar usuarios desde el backend',
        status: err.status || 'unknown',
      });
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Cargando usuarios..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ padding: '20px' }}>
          <ErrorAlert error={error} onRetry={fetchUsers} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="usuario">
        <div className="usuario__header">
          <h1 className="usuario__title">Usuarios del Sistema</h1>
          <p className="usuario__desc">
            Selecciona un usuario para explorar su perfil y pedidos.
          </p>
        </div>
        <div className="usuario__grid">
          {users.length > 0 ? (
            users.map(user => {
              const userId = user.userId || user.pk?.replace(/^USER#/, '') || '';
              const name = user.name || userId;

              return (
                <div
                  key={userId}
                  className="user-card"
                  onClick={() => navigate(`/usuario/${userId}/pedidos`)}
                >
                  <div className="user-card__avatar">
                    {name?.[0]?.toUpperCase() || userId[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-card__info">
                    <div className="user-card__name">{name}</div>
                    <div className="user-card__email">{user.email || '-'}</div>
                    <div className="user-card__addr">{user.address || '-'}</div>
                  </div>
                  <div className="user-card__key">
                    <span className="key-tag">PK</span>
                    <code>{user.pk || `USER#${userId}`}</code>
                  </div>
                  <div className="user-card__arrow">→</div>
                </div>
              );
            })
          ) : (
            <div className="usuario__empty">No se encontraron usuarios.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}