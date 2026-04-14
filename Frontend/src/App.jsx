import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home          from './pages/Home';
import Usuario       from './pages/Usuario';
import Pedidos       from './pages/Pedidos';
import OrdenDetalle  from './pages/OrdenDetalle';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                                index element={<Home />} />
        <Route path="/usuario"                                element={<Usuario />} />
        <Route path="/usuario/:userId/pedidos"                element={<Pedidos />} />
        <Route path="/usuario/:userId/pedidos/:orderId"       element={<OrdenDetalle />} />
      </Routes>
    </BrowserRouter>
  );
}