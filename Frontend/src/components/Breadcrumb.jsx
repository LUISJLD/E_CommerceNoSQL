import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './Breadcrumb.css';

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  const LABELS = {
    usuario: 'Usuario',
    pedidos: 'Pedidos Recientes',
  };

  const crumbs = [{ label: 'Inicio', path: '/' }];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ label: LABELS[seg] || seg.toUpperCase(), path: acc });
  }

  return (
    <nav className="breadcrumb">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.path}>
          {i > 0 && <span className="bc__sep">›</span>}
          {i < crumbs.length - 1
            ? <Link className="bc__link" to={c.path}>{c.label}</Link>
            : <span className="bc__current">{c.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}