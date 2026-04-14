import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getUserOrders, getOrderItems } from '../data/mockDb';
import './OrdenDetalle.css';

export default function OrdenDetalle() {
  const { userId, orderId } = useParams();
  const navigate = useNavigate();

  const orders = getUserOrders(userId);
  const order  = orders.find(o => o.orderId === orderId);
  const items  = getOrderItems(orderId);

  if (!order) return (
    <Layout>
      <div className="od-notfound">
        <p>Orden <strong>#{orderId}</strong> no encontrada.</p>
        <button onClick={() => navigate(-1)}>← Volver</button>
      </div>
    </Layout>
  );

  const totalCalc = items.reduce((s, i) => s + i.subtotal, 0);

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
                <div className="od__meta-val od__meta-val--big">${totalCalc.toLocaleString()}</div>
              </div>
            </div>
          </section>

          {/* Ítems */}
          <section className="od__section">
            <h2 className="od__section-title">Ítems del Pedido</h2>
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
                      <td>${item.unitPrice.toLocaleString()}</td>
                      <td><strong>${item.subtotal.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="od__total-label">Total</td>
                    <td className="od__total-val">${totalCalc.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}