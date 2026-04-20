import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { userAPI, orderAPI } from '../services/api';
import './Pedidos.css';

export default function Pedidos() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, allData] = await Promise.all([
          userAPI.getProfile(userId),
          userAPI.getOrders(userId),
        ]);

        setProfile(profileData);

        // FILTRO ULTRA-ESTRICTO:
        // Solo aceptamos ítems donde la SK sea EXACTAMENTE "ORDER#numeros"
        // Esto descarta automáticamente a los "ORDER#numeros#ITEM#..."
        const regexCabeceraOrden = /^ORDER#\d+$/; 
        
        const onlyRealOrders = allData.filter(item => 
          item.sk && regexCabeceraOrden.test(item.sk)
        );

        setOrders(onlyRealOrders);
      } catch (err) {
        setError({ message: err.message || 'Error al cargar datos' });
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileData, ordersData] = await Promise.all([
        userAPI.getProfile(userId),
        userAPI.getOrders(userId),
      ]);

      setProfile(profileData);
      setOrders(ordersData);
    } catch (err) {
      setError({
        message: err.message || 'Error al cargar datos del usuario',
        status: err.status,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Cargando perfil y órdenes..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ padding: '20px' }}>
          <ErrorAlert error={error} onRetry={handleRetry} />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="od-notfound">
          <p>Usuario <strong>#{userId}</strong> no encontrado.</p>
          <button onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </Layout>
    );
  }

  const totalGastado = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <Layout>
      <div className="pedidos-layout">

        {/* ── Panel izquierdo ── */}
        <aside className="pedidos-aside">

          {/* Perfil */}
          <div className="perfil-card">
            <div className="perfil-card__top">
              <div className="perfil-card__avatar">
                {profile?.name?.[0] || 'U'}
              </div>
              <div>
                <div className="perfil-card__name">{profile?.name}</div>
                <div className="perfil-card__email">{profile?.email}</div>
              </div>
              <button
                className="perfil-card__settings"
                title="Configuración"
                onClick={() => {}}
              >⚙</button>
            </div>

            <div className="perfil-card__row">
              <span className="perfil-card__label">Dirección</span>
              <span>{profile?.address}</span>
            </div>
            <div className="perfil-card__row">
              <span className="perfil-card__label">Pagos</span>
              <span>{profile?.payments?.join(' · ') || 'N/A'}</span>
            </div>

            <div className="perfil-card__key-block">
              <div className="perfil-card__key-row">
                <span className="key-tag">PK</span><code>USER#{userId}</code>
              </div>
              <div className="perfil-card__key-row">
                <span className="key-tag">SK</span><code>PROFILE</code>
              </div>
              <div className="perfil-card__key-ap">AP1 · GetItem</div>
            </div>
          </div>

          {/* Stats */}
          <div className="pedidos-stats">
            <div className="stat-card">
              <div className="stat-card__val">{orders.length}</div>
              <div className="stat-card__label">Pedidos</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__val">${totalGastado.toLocaleString()}</div>
              <div className="stat-card__label">Total gastado</div>
            </div>
          </div>

        </aside>

        {/* ── Panel derecho ── */}
        <main className="pedidos-main">
          {selectedId ? (
            <OrderPreview userId={userId} orderId={selectedId} navigate={navigate} onBack={() => setSelectedId(null)} />
          ) : (
            <div className="pedidos-list-large">
              <div className="pedidos-header">
                <button className="volver-btn" onClick={() => navigate('/')}>← Volver</button>
                <h1>Mis Pedidos</h1>
                <p>{orders.length} pedidos encontrados</p>
              </div>
              {orders.length === 0 ? (
                <div className="pedidos-empty">
                  <div className="pedidos-empty__icon">📦</div>
                  <div className="pedidos-empty__text">No hay pedidos disponibles</div>
                </div>
              ) : (
                <div className="pedidos-grid">
                  {orders.map(order => (
                    <div
                      key={order.orderId}
                      className="pedido-card"
                      onClick={() => setSelectedId(order.orderId)}
                    >
                      <div className="pedido-card__header">
                        <div className="pedido-card__id">ORD#{order.orderId}</div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="pedido-card__date">{order.date}</div>
                      <div className="pedido-card__address">{order.address}</div>
                      <div className="pedido-card__total">${order.total?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

      </div>
    </Layout>
  );
}

function OrderPreview({ userId, orderId, navigate, onBack }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        // 1. Obtenemos todos los ítems de la partición del usuario (Perfil, Órdenes e Ítems)
        const allData = await userAPI.getOrders(userId);

        // 2. Extraemos la cabecera del pedido (el ítem con SK: ORDER#10X)
        const foundOrder = allData.find(o => o.orderId === orderId);
        setOrder(foundOrder);

        // 3. Extraemos los productos asociados a ese pedido específico
        // Filtramos por la SK que sigue el patrón: ORDER#{ID}#ITEM#...
        const orderItems = allData.filter(item => 
          item.sk && item.sk.startsWith(`ORDER#${orderId}#ITEM#`)
        );

        setItems(orderItems);
      } catch (err) {
        console.error('Error al recuperar el detalle del pedido:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId && orderId) {
      fetchOrderData();
    }
  }, [userId, orderId]);

  if (loading || !order) return null;

  return (
    <div className="order-preview">
      <div className="order-preview__header">
        <div>
          <button className="order-preview__back-btn" onClick={onBack}>
            ← Regresar a la lista
          </button>
          <div className="order-preview__tag">Detalle del Pedido</div>
          <h2 className="order-preview__id">ORD#{order.orderId}</h2>
        </div>
        <button
          className="order-preview__full-btn"
          onClick={() => navigate(`/usuario/${userId}/pedidos/${orderId}`)}
        >
          Ver página completa →
        </button>
      </div>

      <div className="order-preview__meta">
        <div className="meta-item"><span>Fecha</span><strong>{order.date}</strong></div>
        <div className="meta-item"><span>Dirección</span><strong>{order.address}</strong></div>
        <div className="meta-item"><span>Estado</span><StatusBadge status={order.status} /></div>
        <div className="meta-item"><span>Total</span><strong>${order.total.toLocaleString()}</strong></div>
      </div>

      <div className="order-preview__items-title">
        <span>Ítems del Pedido</span>
        <code>PK=ORDER#{orderId} · SK begins_with ITEM#</code>
      </div>
      {items.length > 0 ? (
        <table className="items-table">
          <thead>
            <tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.sk}>
                <td>{item.product}</td>
                <td>{item.qty}</td>
                <td>${item.unitPrice?.toLocaleString() || '0'}</td>
                <td>${item.subtotal?.toLocaleString() || '0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No hay ítems disponibles
        </div>
      )}
    </div>
  );
}