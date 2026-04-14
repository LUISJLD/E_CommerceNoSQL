import React from 'react';
import { STATUS_COLORS } from '../data/mockDb';
import './StatusBadge.css';

export default function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { color: '#aaaacc', bg: 'rgba(170,170,204,0.1)' };
  return (
    <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}>
      <span className="badge__dot" style={{ background: s.color }} />
      {status}
    </span>
  );
}