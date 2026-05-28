# EcoCart — E-Commerce Serverless (NoSQL)

Sistema de e-commerce desarrollado para la cátedra de **Bases de Datos No Relacionales**. Implementa una arquitectura moderna de alto rendimiento **100% Serverless** basada en **Amazon DynamoDB** con **Single Table Design**, cache-aside con **Redis**, AWS Lambda, API Gateway, y un frontend moderno desacoplado.

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
| Base de Datos | Amazon DynamoDB (Single Table Design) |
| Cache | Redis 7 (cache-aside pattern) |
| Backend | 11 funciones AWS Lambda (Python 3.12) + Amazon API Gateway REST |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| Infraestructura | Script de despliegue automático con boto3 (deploy.py) |
| Emulación Local | LocalStack 3.4 + Docker Compose |
| Autenticación | JWT (PyJWT) con roles admin/user |

---

## Arquitectura

```text
┌─────────────┐       ┌──────────────────────────────────────────────────┐
│   Browser   │       │              Docker Compose                       │
│  (React)    │       │                                                   │
│ localhost:  │──────▶│  ┌─────────┐    ┌────────────────────────────┐   │
│    5173     │       │  │  Vite   │───▶│      LocalStack :4566      │   │
└─────────────┘       │  │ (proxy) │    │                            │   │
                      │  └─────────┘    │  ┌──────────────────────┐  │   │
                      │                 │  │    API Gateway REST   │  │   │
                      │                 │  └──────────┬───────────┘  │   │
                      │                 │             │               │   │
                      │                 │  ┌──────────▼───────────┐  │   │
                      │                 │  │   Lambda Functions    │  │   │
                      │                 │  │  (11 microservicios)  │  │   │
                      │                 │  └───┬─────────────┬────┘  │   │
                      │                 │      │             │        │   │
                      │                 │  ┌───▼────┐   ┌───▼─────┐  │   │
                      │                 │  │DynamoDB│   │  Redis   │  │   │
                      │                 │  │(Single │   │ (Cache)  │  │   │
                      │                 │  │ Table) │   │  :6379   │  │   │
                      │                 │  └────────┘   └─────────┘  │   │
                      │                 └────────────────────────────┘   │
                      └──────────────────────────────────────────────────┘
```

---

## Estructura del Proyecto

```text
├── client/                  # React + TypeScript (Vite)
│   ├── src/
│   │   ├── contexts/        # Estado global (Auth, Cart)
│   │   ├── features/        # Módulos por dominio (products, cart, auth)
│   │   ├── pages/           # Vistas principales y Panel de Admin
│   │   ├── services/        # Capa de datos (llamadas al API Gateway)
│   │   └── hooks/           # Custom hooks (useProducts)
│   └── Dockerfile
├── infrastructure/          # Despliegue automatizado
│   ├── deploy.py            # Script principal (crea DynamoDB, IAM, Lambdas, API GW)
│   └── init-localstack.sh   # Entrypoint que orquesta deploy + seed
├── lambdas/                 # Funciones Lambda (Backend)
│   ├── auth/                # Registro e inicio de sesión (JWT)
│   ├── manage_cart/         # Carrito de compras (cache-aside con Redis)
│   ├── manage_products/     # CRUD de productos (admin)
│   ├── manage_orders/       # Gestión de órdenes (admin)
│   ├── create_order/        # Checkout (crear orden desde carrito)
│   ├── get_products/        # Catálogo público
│   ├── get_all_users/       # Listar usuarios
│   ├── get_user_profile/    # Perfil de usuario
│   ├── get_user_orders/     # Historial de pedidos
│   ├── get_order_by_id/     # Detalle de orden
│   ├── get_order_items/     # Items de una orden
│   └── shared/              # Módulos compartidos (dynamo, cache, responses, auth)
├── docker-compose.yml       # Orquestación: LocalStack + Redis + Frontend
├── seed-data.py             # Datos iniciales (productos, usuarios, órdenes)
└── .env.example             # Variables de entorno de referencia
```

---

## Ejecución

### Requisitos previos
- Docker Desktop (con WSL2 en Windows)
- Git

### Levantar el proyecto

```bash
git clone https://github.com/LUISJLD/E_CommerceNoSQL.git
cd E_CommerceNoSQL
```

Crear archivo `.env` en la raíz con la ruta absoluta del proyecto:

```bash
# Windows
echo LAMBDA_HOST_PROJECT_PATH=C:/Users/TU_USUARIO/ruta/al/E_CommerceNoSQL > .env

# Linux/Mac
echo LAMBDA_HOST_PROJECT_PATH=$(pwd) > .env
```

Levantar todo:

```bash
docker compose up --build
```

Esperar ~90 segundos a que el deploy automático complete (verás en los logs de localstack: `Deploy completado`). Luego acceder a:

- **Tienda:** http://localhost:5173
- **LocalStack:** http://localhost:4566

### Credenciales por defecto

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@ecommerce.com` | `admin123` |
| Usuario | `jgarcia@gmail.com` | `user123` |
| Usuario | `ana.mtz@outlook.com` | `user123` |
| Usuario | `daniel@unimag.edu.co` | `user123` |

---

## API REST — Endpoints

### Públicos

| Método | Ruta | Lambda | Descripción |
|--------|------|--------|-------------|
| POST | `/auth/login` | Auth | Iniciar sesión |
| POST | `/auth/register` | Auth | Registrar usuario |
| GET | `/products` | GetAllProducts | Listar catálogo |

### Autenticados (requieren JWT)

| Método | Ruta | Lambda | Descripción |
|--------|------|--------|-------------|
| GET | `/cart/{user_id}` | ManageUserCart | Ver carrito |
| POST | `/cart/{user_id}` | ManageUserCart | Agregar al carrito |
| DELETE | `/cart/{user_id}` | ManageUserCart | Quitar del carrito |
| POST | `/orders` | CreateOrder | Crear orden (checkout) |
| GET | `/user/{user_id}/orders` | GetUserOrders | Historial de pedidos |
| GET | `/orders/{order_id}/items` | GetOrderItems | Items de una orden |
| GET | `/users/{user_id}` | GetUserProfile | Perfil de usuario |

### Admin (requieren JWT con role=admin)

| Método | Ruta | Lambda | Descripción |
|--------|------|--------|-------------|
| GET | `/admin/products` | GetAllProducts | Listar productos |
| POST | `/admin/products` | ManageProducts | Crear producto |
| PUT | `/admin/products/{id}` | ManageProducts | Editar producto |
| DELETE | `/admin/products/{id}` | ManageProducts | Eliminar producto |
| GET | `/admin/orders` | ManageOrders | Listar órdenes |
| PUT | `/admin/orders/{id}/status` | ManageOrders | Cambiar estado |

---

## Modelado de Datos (Single Table Design)

Toda la información se almacena en una sola tabla DynamoDB (`Ecommerce`) con un GSI:

| Entidad | Partition Key (pk) | Sort Key (sk) | GSI1PK | GSI1SK | Propósito |
|---------|-------------------|---------------|--------|--------|-----------|
| Usuario | `USER#<email>` | `PROFILE` | — | — | Perfil, credenciales y rol |
| Orden (por usuario) | `USER#<email>` | `ORDER#<id>` | `ORDER#<id>` | `METADATA` | Cabecera del pedido |
| Items de orden | `ORDER#<id>` | `ITEM#<prod>` | — | — | Detalle de productos comprados |
| Carrito | `USER#<email>` | `CART#<prod>` | — | — | Producto en carrito (temporal) |
| Producto | `CATALOG#main` | `PRODUCT#<id>` | — | — | Catálogo general |

**GSI1** permite buscar una orden por su ID sin conocer el usuario: `Query GSI1 WHERE gsi1pk = ORDER#<id>`.

---

## Patrón Cache-Aside (Redis)

```text
Cliente → Lambda → ¿Redis tiene el dato?
                      ├── SÍ → Responde desde cache (~2ms)
                      └── NO → Consulta DynamoDB → Guarda en Redis → Responde (~50ms)
```

- TTL general: 30 segundos
- TTL carrito: 60 segundos
- Fallback: si Redis no está disponible, las Lambdas consultan DynamoDB directamente

---

## Funcionalidades

### Usuario
- Registro e inicio de sesión con JWT
- Explorar catálogo con filtro por categoría y búsqueda
- Agregar/quitar productos del carrito
- Realizar compra (checkout)
- Ver historial de pedidos

### Administrador
- Dashboard con resumen de órdenes y productos
- CRUD completo de productos (con imágenes vía S3)
- Ver y gestionar todas las órdenes (cambiar estado)

---

## Solución de Problemas

### El frontend no carga (se queda en blanco)
Verificar que el deploy completó revisando los logs:
```bash
docker logs localstack 2>&1 | grep "Deploy completado"
```
Si no aparece, revisar errores con `docker logs localstack`.

### Error de CORS en el browser
Verificar que los contenedores están corriendo:
```bash
docker ps
```
El frontend debe poder alcanzar a `localstack:4566` a través del proxy de Vite.

### El carrito no muestra datos de caché
Verificar que Redis está healthy:
```bash
docker exec redis_cache redis-cli ping
```
Si Redis está caído, las Lambdas funcionan (fallback a DynamoDB) pero sin la velocidad del cache.

### Los cambios al código de Lambdas no se reflejan
LocalStack usa **hot-reload**: los cambios en `lambdas/` se reflejan automáticamente sin reiniciar. Si no funciona, verificar que `LAMBDA_HOST_PROJECT_PATH` está correctamente configurado en `.env`.
