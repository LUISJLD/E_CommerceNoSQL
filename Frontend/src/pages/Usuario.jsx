import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUserProfile } from '../data/mockDb';
import './Usuario.css';

const USERS = ['luisa'];

export default function Usuario() {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="usuario">
        <div className="usuario__header">
          <h1 className="usuario__title">Usuarios del Sistema</h1>
          <p className="usuario__desc">
            Selecciona un usuario para explorar su perfil y pedidos.
          </p>
        </div>
        <div className="usuario__grid">
          {USERS.map(uid => {
            const profile = getUserProfile(uid);
            return (
              <div
                key={uid}
                className="user-card"
                onClick={() => navigate(`/usuario/${uid}/pedidos`)}
              >
                <div className="user-card__avatar">
                  {profile?.name?.[0] || uid[0].toUpperCase()}
                </div>
                <div className="user-card__info">
                  <div className="user-card__name">{profile?.name || uid}</div>
                  <div className="user-card__email">{profile?.email}</div>
                  <div className="user-card__addr">{profile?.address}</div>
                </div>
                <div className="user-card__key">
                  <span className="key-tag">PK</span>
                  <code>USER#{uid}</code>
                </div>
                <div className="user-card__arrow">→</div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}