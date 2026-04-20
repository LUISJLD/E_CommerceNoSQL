import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { userAPI, orderAPI } from '../services/api';
import './OrdenDetalle.css';

export default function OrdenDetalle() {
  const { userId, orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);

        const ordersData = await userAPI.getOrders(userId);
        const foundOrder = ordersData.find(o => o.orderId === orderId);

        if (!foundOrder) {
          setError({
            message: `Orden #${orderId} no encontrada para el usuario ${userId}`,
            status: 404,
          });
          return;
        }

        setOrder(foundOrder);

        try {
          const itemsData = await orderAPI.getOrderItems(orderId);
          setItems(itemsData || []);
        } catch (itemsErr) {
          console.warn('No se pueden cargar ítems:', itemsErr.message);
          setItems([]);
        }
      } catch (err) {
        setError({
          message: err.message || 'Error al cargar orden',
          status: err.status,
        });
        console.error('Error fetching order data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [userId, orderId]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);

      const ordersData = await userAPI.getOrders(userId);
      const foundOrder = ordersData.find(o => o.orderId === orderId);

      if (foundOrder) {
        setOrder(foundOrder);
        try {
          const itemsData = await orderAPI.getOrderItems(orderId);
          setItems(itemsData || []);
        } catch (itemsErr) {
          console.warn('No se pueden cargar ítems:', itemsErr.message);
          setItems([]);
        }
      }
    } catch (err) {
      setError({
        message: err.message || 'Error al cargar orden',
        status: err.status,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Cargando detalles de la orden..." />
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

  if (!order) {
    return (
      <Layout>
        <div className="od-notfound">
          <p>Orden <strong>#{orderId}</strong> no encontrada.</p>
          <button onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </Layout>
    );
  }

  const totalCalc = items.reduce((s, i) => s + (i.subtotal || 0), 0);

  return (
    <Layout>
      <div className="od">

        {/* Top bar */}
        <div className="od__topbar">
          <button className="od__back" onClick={() => navigate(-1)}>← Volver</button>
          <div>
            <div className="od__supertitle">Detalle del Pedido</div>
            <h1 className="od__title">ORD#{order.orderId}</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* DynamoDB keys panel */}
        <div className="od__keys-panel">
          <div className="od__key-group">
            <span className="od__key-label">AP2 · Orden del usuario</span>
            <div className="od__key-row"><span className="key-tag">PK</span><code>USER#{userId}</code></div>
            <div className="od__key-row"><span className="key-tag">SK</span><code>ORDER#{order.date}T...#{orderId}</code></div>
          </div>
          <div className="od__key-divider" />
          <div className="od__key-group">
            <span className="od__key-label">AP4 · GSI (sin userId)</span>
            <div className="od__key-row"><span className="key-tag">GSI1PK</span><code>ORDER#{orderId}</code></div>
            <div className="od__key-row"><span className="key-tag">GSI1SK</span><code>METADATA</code></div>
          </div>
          <div className="od__key-divider" />
          <div className="od__key-group">
            <span className="od__key-label">AP3 · Ítems de la orden</span>
            <div className="od__key-row"><span className="key-tag">PK</span><code>ORDER#{orderId}</code></div>
            <div className="od__key-row"><span className="key-tag">SK</span><code>begins_with ITEM#</code></div>
          </div>
        </div>

        <div className="od__grid">

          {/* Información general */}
          <section className="od__section">
            <h2 className="od__section-title">Información General</h2>
            <div className="od__meta-grid">
              <div className="od__meta-card">
                <div className="od__meta-label">ID Orden</div>
                <div className="od__meta-val">ORD#{order.orderId}</div>
              </div>
              <div className="od__meta-card">
                <div className="od__meta-label">Fecha</div>
                <div className="od__meta-val">{order.date}</div>
              </div>
              <div className="od__meta-card">
                <div className="od__meta-label">Dirección</div>
                <div className="od__meta-val">{order.address}</div>
              </div>
              <div className="od__meta-card">
                <div className="od__meta-label">Estado</div>
                <div className="od__meta-val"><StatusBadge status={order.status} /></div>
              </div>
              <div className="od__meta-card od__meta-card--total">
                <div className="od__meta-label">Total de la orden</div>
                <div className="od__meta-val od__meta-val--big">${totalCalc?.toLocaleString() || order.total?.toLocaleString()}</div>
              </div>
            </div>
          </section>

          {/* Ítems */}
          <section className="od__section">
            <h2 className="od__section-title">Ítems del Pedido ({items.length})</h2>
            {items.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                <p>No hay ítems disponibles</p>
              </div>
            ) : (
              <div className="od__items-table-wrap">
                <table className="od__items-table">
                  <thead>
                    <tr>
                      <th>SK (DynamoDB)</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.sk}>
                        <td><code>{item.sk}</code></td>
                        <td>{item.product}</td>
                        <td>{item.qty}</td>
                        <td>${item.unitPrice?.toLocaleString() || '0'}</td>
                        <td><strong>${item.subtotal?.toLocaleString() || '0'}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="od__total-label">Total</td>
                        <td className="od__total-val">${totalCalc.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </section>

        </div>
      </div>
    </Layout>
  );
}