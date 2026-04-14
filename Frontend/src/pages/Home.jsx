import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import './Home.css';

const ACCESS_PATTERNS = [
  { id:'AP1', label:'Perfil de usuario',       query:"PK=USER#<id>, SK=PROFILE",            op:'GetItem',   color:'#4f6ef7' },
  { id:'AP2', label:'Órdenes de un usuario',   query:"PK=USER#<id>, SK begins_with ORDER#", op:'Query',     color:'#22c55e' },
  { id:'AP3', label:'Ítems de una orden',       query:"PK=ORDER#<id>, SK begins_with ITEM#", op:'Query',     color:'#f59e0b' },
  { id:'AP4', label:'Orden sin usuario (GSI1)', query:"GSI1PK=ORDER#<id>, GSI1SK=METADATA",  op:'GSI Query', color:'#a855f7' },
  { id:'AP5', label:'Productos por categoría',  query:"PK=PROD#<id>, SK=CAT#<categoria>",    op:'Query',     color:'#06b6d4' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="home">

        <div className="home__hero">
          <div className="home__hero-tag">NoSQL · DynamoDB · Single Table Design</div>
          <h1 className="home__title">Mi Mercado Global</h1>
          <p className="home__desc">
            Panel de control construido sobre DynamoDB con diseño de tabla única.<br />
            Todos los accesos se resuelven en un solo query — sin joins, sin scans.
          </p>
          <button className="home__cta" onClick={() => navigate('/usuario')}>
            Explorar usuarios <span>→</span>
          </button>
        </div>

        <section className="home__section">
          <h2 className="home__section-title">
            <span className="home__section-tag">Diseño</span>
            Patrones de Acceso
          </h2>
          <div className="home__patterns">
            {ACCESS_PATTERNS.map(ap => (
              <div className="ap-card" key={ap.id} style={{ '--c': ap.color }}>
                <div className="ap-card__id">{ap.id}</div>
                <div className="ap-card__label">{ap.label}</div>
                <code className="ap-card__query">{ap.query}</code>
                <span className="ap-card__op">{ap.op}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="home__section">
          <h2 className="home__section-title">
            <span className="home__section-tag">Estructura</span>
            Tabla de Llaves
          </h2>
          <div className="home__table-wrap">
            <table className="home__table">
              <thead>
                <tr><th>PK</th><th>SK</th><th>GSI1PK</th><th>GSI1SK</th><th>Propósito</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>USER#luisa</code></td>
                  <td><code>PROFILE</code></td>
                  <td>—</td><td>—</td>
                  <td>Perfil. SK fijo como discriminador de tipo.</td>
                </tr>
                <tr>
                  <td><code>USER#luisa</code></td>
                  <td><code>ORDER#2023-10-27...#555</code></td>
                  <td><code>ORDER#555</code></td>
                  <td><code>METADATA</code></td>
                  <td>Orden. Timestamp en SK garantiza orden cronológico.</td>
                </tr>
                <tr>
                  <td><code>ORDER#555</code></td>
                  <td><code>ITEM#laptop-xps</code></td>
                  <td>—</td><td>—</td>
                  <td>Ítem de orden. Comparte partición con otros ítems.</td>
                </tr>
                <tr>
                  <td><code>PROD#laptop-xps</code></td>
                  <td><code>CAT#electronica</code></td>
                  <td>—</td><td>—</td>
                  <td>Producto. SK permite agrupar por categoría.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </Layout>
  );
}