import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getUserProfile, getUserOrders } from '../data/mockDb';
import './Pedidos.css';

export default function Pedidos() {
  const { userId } = useParams();
  const navigate   = useNavigate();
  const profile    = getUserProfile(userId);
  const orders     = getUserOrders(userId);
  const [selectedId, setSelectedId] = useState(null);

  const totalGastado = orders.reduce((s, o) => s + o.total, 0);

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
              <span>{profile?.payments?.join(' · ')}</span>
            </div>

            {/* DynamoDB key */}
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

          {/* Lista de pedidos */}
          <div className="pedidos-list-header">
            <span className="pedidos-list-title">Pedidos Recientes</span>
            <div className="pedidos-list-subkey">
              <code>SK begins_with ORDER#</code>
            </div>
          </div>

          <div className="pedidos-list">
            {orders.map(order => (
              <div
                key={order.orderId}
                className={`pedido-row ${selectedId === order.orderId ? 'pedido-row--active' : ''}`}
                onClick={() => setSelectedId(order.orderId)}
              >
                <div className="pedido-row__left">
                  <StatusBadge status={order.status} />
                  <span className="pedido-row__date">{order.date}</span>
                </div>
                <div className="pedido-row__right">
                  <span className="pedido-row__addr">{order.address}</span>
                  <button
                    className="pedido-row__detail-btn"
                    onClick={e => { e.stopPropagation(); navigate(`/usuario/${userId}/pedidos/${order.orderId}`); }}
                  >
                    Ver detalle →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Panel derecho ── */}
        <main className="pedidos-main">
          {selectedId ? (
            <OrderPreview userId={userId} orderId={selectedId} navigate={navigate} />
          ) : (
            <div className="pedidos-empty">
              <div className="pedidos-empty__icon">📦</div>
              <div className="pedidos-empty__text">
                Selecciona un pedido para ver su detalle
              </div>
            </div>
          )}
        </main>

      </div>
    </Layout>
  );
}

// ── Preview inline ────────────────────────────────────────────────────
import { getOrderItems } from '../data/mockDb';

function OrderPreview({ userId, orderId, navigate }) {
  const { getUserOrders, getOrderItems } = require('../data/mockDb');
  const orders = getUserOrders(userId);
  const order  = orders.find(o => o.orderId === orderId);
  const items  = getOrderItems(orderId);
  if (!order) return null;

  return (
    <div className="order-preview">
      <div className="order-preview__header">
        <div>
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
      <table className="items-table">
        <thead>
          <tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.sk}>
              <td>{item.product}</td>
              <td>{item.qty}</td>
              <td>${item.unitPrice.toLocaleString()}</td>
              <td>${item.subtotal.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}