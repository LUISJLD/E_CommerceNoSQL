import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__brand">
        <span className="header__main">Mi Mercado Global</span>
        <span className="header__sep"> — </span>
        <span className="header__sub">Panel de Control</span>
      </Link>
      <button className="header__help">?</button>
    </header>
  );
}