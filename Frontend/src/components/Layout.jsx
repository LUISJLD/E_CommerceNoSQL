import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import './Layout.css';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const showBreadcrumb = !pathname.includes('/pedidos');

  return (
    <div className="layout">
      <Header />
      {showBreadcrumb && <Breadcrumb />}
      <main className="layout__content">{children}</main>
    </div>
  );
}