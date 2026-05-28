# EcoCart — E-Commerce NoSQL

Sistema de e-commerce desarrollado para la cátedra de **Bases de Datos No Relacionales**. Implementa una arquitectura de alto rendimiento basada en **DynamoDB** con **Single Table Design**, cache-aside con **Redis**, y un frontend moderno desacoplado.

## Integrantes - Grupo 2
* Daniel Eduardo Bocachica Castillo
* Luis David Pérez Flórez
* Camilo Pérez Moreno
* Jesus Capataz
* Daniel Rangel Morales

**Profesor:** Carlos Andres Oliveros Villanueva  
**Institución:** Universidad del Magdalena (2026-1)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Base de Datos | Amazon DynamoDB (Local) |
| Cache | Redis 7 |
| Backend | Python 3.12 + Django 5 + DRF |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| Infraestructura | Docker Compose, LocalStack (Lambda + API Gateway), AWS CDK |

---

## Ejecución

Un solo comando levanta todo el sistema:

```bash
docker compose up --build
```

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 8000 | http://localhost:8000/api/ |
| DynamoDB Local | 3000 | — |
| Redis | 6379 | — |
| LocalStack | 4566 | — |

El backend automáticamente crea la tabla DynamoDB y carga datos de prueba al iniciar.

---

## Estructura del Proyecto

```
├── backend/                 # Django REST API
│   ├── core/                # Settings, URLs, WSGI
│   ├── ecommerce/           # App principal (views, services, aws_client)
│   ├── create_table.py      # Crea tabla DynamoDB al iniciar
│   ├── seed-data.py         # Datos de prueba (productos, usuarios, órdenes)
│   └── Dockerfile
├── frontend/                # React + TypeScript (Vite)
│   ├── src/
│   │   ├── contexts/        # Estado global (Auth, Cart)
│   │   ├── features/        # Módulos por dominio (products, cart, auth)
│   │   ├── hooks/           # Custom hooks
│   │   ├── layouts/         # Layout components
│   │   ├── services/        # Capa de datos (API calls)
│   │   └── shared/          # Types, constants, componentes reutilizables
│   └── Dockerfile
├── infrastructure/          # AWS CDK stacks
├── lambdas/                 # Lambda handlers (LocalStack)
└── docker-compose.yml       # Orquestación completa
```

---

## Modelado de Datos (Single Table Design)

| Entidad | PK | SK | Propósito |
|---------|----|----|-----------|
| Usuario | `USER#<id>` | `PROFILE` | Perfil (nombre, email, dirección) |
| Orden | `USER#<id>` | `ORDER#<id>` | Cabecera del pedido |
| Ítem | `ORDER#<id>` | `ITEM#<prod>` | Producto dentro de una orden |
| Producto | `CATALOG#main` | `PRODUCT#<id>` | Catálogo de productos |

**GSI1:** `gsi1pk=ORDER#<id>`, `gsi1sk=METADATA` — Buscar orden sin conocer el usuario.

---

## API Endpoints

```
GET /api/products/                    → Catálogo de productos (?category=)
GET /api/users/                       → Todos los usuarios
GET /api/user/<id>/profile/           → Perfil de usuario
GET /api/user/<id>/orders/            → Órdenes de un usuario
GET /api/orders/search/<order_id>/    → Buscar orden por ID (GSI1)
GET /api/orders/<order_id>/items/     → Ítems de una orden
```
