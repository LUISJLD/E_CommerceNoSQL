# EcoCart Frontend

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- Bootstrap Icons

## Arquitectura

```
src/
├── main.tsx                        # Entry point
├── App.tsx                         # Composición raíz (Providers + Layout)
├── index.css                       # Tailwind import
│
├── contexts/                       # Estado global (Context + useReducer)
│   ├── AuthContext.tsx             # Sesión del usuario
│   └── CartContext.tsx             # Carrito de compras
│
├── hooks/                          # Custom hooks (lógica reactiva)
│   └── useProducts.ts             # Fetch + filtrado de productos
│
├── services/                       # Capa de datos (desacoplada de UI)
│   └── product.service.ts         # Obtener y filtrar productos
│
├── layouts/                        # Estructura visual de la app
│   ├── MainLayout.tsx             # Shell principal (Header + content + Footer)
│   ├── Header.tsx                 # Barra superior
│   ├── Navbar.tsx                 # Navegación
│   └── Footer.tsx                 # Pie de página
│
├── features/                       # Módulos por dominio
│   ├── auth/components/
│   │   └── ProfileMenu.tsx        # Dropdown de perfil/sesión
│   ├── cart/components/
│   │   └── CartButton.tsx         # Botón carrito con badge
│   └── products/components/
│       ├── CategoryFilter.tsx     # Sidebar de categorías
│       ├── ProductCard.tsx        # Tarjeta de producto
│       └── ProductGrid.tsx        # Grid de productos
│
└── shared/                         # Código reutilizable entre features
    ├── types/index.ts             # Interfaces (Product, User, CartItem)
    ├── constants/index.ts         # Nav items, categorías, formato moneda
    └── components/
        ├── Logo.tsx               # Logotipo
        └── SearchInput.tsx        # Input de búsqueda
```

## Patrones aplicados

| Patrón | Dónde | Por qué |
|--------|-------|---------|
| Feature-based structure | `features/` | Cada dominio encapsula sus componentes |
| Context + useReducer | `contexts/` | Estado global predecible con acciones tipadas |
| Custom Hooks | `hooks/` | Separar lógica de negocio de la UI |
| Service Layer | `services/` | Desacoplar la fuente de datos del resto |
| Layout Pattern | `layouts/` | Estructura visual reutilizable |
| Barrel exports | `shared/types`, `shared/constants` | Imports limpios |

## Conectar con backend

La capa de servicios (`services/`) es el único punto de contacto con el backend. Para conectar con una API real:

```ts
// services/product.service.ts
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error("Error fetching products");
  return res.json();
}
```

Los contexts y hooks ya consumen estos services — la UI no requiere cambios.

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción (tsc + vite)
npm run lint      # ESLint
npm run preview   # Preview del build
```
