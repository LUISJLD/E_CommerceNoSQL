import React from 'react';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <Breadcrumb />
      <main className="layout__content">{children}</main>
    </div>
  );
}