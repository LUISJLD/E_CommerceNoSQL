export const db = [
  // ── Perfil ────────────────────────────────────────────────────
  {
    pk: 'USER#luisa', sk: 'PROFILE', type: 'USER_PROFILE',
    name: 'Luisa', email: 'l@mail.com',
    address: 'Santa Marta 54C #26B',
    payments: ['Nequi 1234', 'PayPal'],
  },

  // ── Órdenes ───────────────────────────────────────────────────
  { pk:'USER#luisa', sk:'ORDER#2023-10-27T10:00:00Z#555', gsi1pk:'ORDER#555', gsi1sk:'METADATA',
    type:'ORDER', orderId:'555', status:'Pago Exitoso', date:'2023-10-27', address:'Calle 53',  total:123322 },
  { pk:'USER#luisa', sk:'ORDER#2023-10-15T08:30:00Z#442', gsi1pk:'ORDER#442', gsi1sk:'METADATA',
    type:'ORDER', orderId:'442', status:'Enviado',      date:'2023-10-15', address:'Calle 99',  total:85000  },
  { pk:'USER#luisa', sk:'ORDER#2023-09-30T14:15:00Z#380', gsi1pk:'ORDER#380', gsi1sk:'METADATA',
    type:'ORDER', orderId:'380', status:'Pago Exitoso', date:'2023-09-30', address:'Calle 100', total:47500  },
  { pk:'USER#luisa', sk:'ORDER#2023-09-12T17:45:00Z#301', gsi1pk:'ORDER#301', gsi1sk:'METADATA',
    type:'ORDER', orderId:'301', status:'Entregado',    date:'2023-09-12', address:'Calle 44',  total:198000 },
  { pk:'USER#luisa', sk:'ORDER#2023-08-22T09:00:00Z#240', gsi1pk:'ORDER#240', gsi1sk:'METADATA',
    type:'ORDER', orderId:'240', status:'Enviado',      date:'2023-08-22', address:'Calle 99',  total:32000  },

  // ── Ítems de órdenes ──────────────────────────────────────────
  { pk:'ORDER#555', sk:'ITEM#laptop-xps',    type:'ORDER_ITEM', product:'Laptop XPS',          qty:1, unitPrice:1200, subtotal:1200 },
  { pk:'ORDER#555', sk:'ITEM#libro-capital', type:'ORDER_ITEM', product:'Libro "El Capital"',  qty:2, unitPrice:25,   subtotal:50   },
  { pk:'ORDER#555', sk:'ITEM#mouse-logit',   type:'ORDER_ITEM', product:'Mouse Logitech MX',   qty:1, unitPrice:89,   subtotal:89   },

  { pk:'ORDER#442', sk:'ITEM#teclado-mech',  type:'ORDER_ITEM', product:'Teclado Mecánico',    qty:1, unitPrice:250,  subtotal:250  },
  { pk:'ORDER#442', sk:'ITEM#audifono-sony', type:'ORDER_ITEM', product:'Audífonos Sony WH',   qty:1, unitPrice:320,  subtotal:320  },

  { pk:'ORDER#380', sk:'ITEM#camisa-azul',   type:'ORDER_ITEM', product:'Camisa Azul M',       qty:3, unitPrice:45,   subtotal:135  },
  { pk:'ORDER#380', sk:'ITEM#pantalon-n',    type:'ORDER_ITEM', product:'Pantalón Negro 32',   qty:2, unitPrice:89,   subtotal:178  },

  { pk:'ORDER#301', sk:'ITEM#ipad-pro',      type:'ORDER_ITEM', product:'iPad Pro 12.9"',      qty:1, unitPrice:1100, subtotal:1100 },
  { pk:'ORDER#301', sk:'ITEM#funda-ipad',    type:'ORDER_ITEM', product:'Funda iPad Leather',  qty:1, unitPrice:45,   subtotal:45   },
  { pk:'ORDER#301', sk:'ITEM#pencil-apple',  type:'ORDER_ITEM', product:'Apple Pencil 2',      qty:1, unitPrice:129,  subtotal:129  },

  { pk:'ORDER#240', sk:'ITEM#libro-atomic',  type:'ORDER_ITEM', product:'Atomic Habits',       qty:1, unitPrice:18,   subtotal:18   },
  { pk:'ORDER#240', sk:'ITEM#libro-rich',    type:'ORDER_ITEM', product:'Rich Dad Poor Dad',   qty:1, unitPrice:14,   subtotal:14   },
];

// ── Access Pattern Helpers ────────────────────────────────────────────

/** AP1: PK=USER#<id>, SK=PROFILE */
export function getUserProfile(userId) {
  return db.find(i => i.pk === `USER#${userId}` && i.sk === 'PROFILE') || null;
}

/** AP2: PK=USER#<id>, SK begins_with ORDER# */
export function getUserOrders(userId) {
  return db
    .filter(i => i.pk === `USER#${userId}` && i.sk.startsWith('ORDER#'))
    .sort((a, b) => b.sk.localeCompare(a.sk));
}

/** AP3: PK=ORDER#<id>, SK begins_with ITEM# */
export function getOrderItems(orderId) {
  return db.filter(i => i.pk === `ORDER#${orderId}` && i.sk.startsWith('ITEM#'));
}

export const STATUS_COLORS = {
  'Pago Exitoso': { color: '#4f6ef7', bg: 'rgba(79,110,247,0.12)'  },
  'Enviado':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  'Entregado':    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  'Cancelado':    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};