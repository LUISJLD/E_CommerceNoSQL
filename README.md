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
| Cache | Redis 7 |
| Backend | Funciones AWS Lambda (Python 3.12) + Amazon API Gateway |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| Infraestructura as Code | AWS CDK v2 |
| Emulación Local | LocalStack + Docker Compose |

---

## Estructura del Proyecto

```text
├── Frontend/                # React + TypeScript (Vite)
│   ├── src/
│   │   ├── contexts/        # Estado global (Auth, Cart)
│   │   ├── features/        # Módulos por dominio (products, cart, auth)
│   │   ├── pages/           # Vistas principales y Panel de Admin
│   │   └── services/        # Capa de datos (Llamadas al API Gateway)
│   └── Dockerfile
├── infrastructure/          # Definición de Infraestructura (AWS CDK)
│   ├── stacks/              # Stacks (API, DynamoDB, Lambda, Redis)
│   └── app.py               # Punto de entrada de CDK
├── lambdas/                 # Funciones Lambda (Backend)
│   ├── auth/                # Registro e inicio de sesión
│   ├── manage_cart/         # Carrito de compras (Cache-aside con Redis)
│   ├── manage_products/     # Catálogo y administración
│   └── ...                  # Otras funciones de dominio
├── docker-compose.yml       # Orquestación de LocalStack, Redis y Frontend
└── seed-data.py             # Script opcional para poblar base de datos inicial
```

---

## Ejecución (Paso a Paso)

Para levantar el proyecto en tu entorno local, sigue este orden estricto:

### 1. Levantar los Servicios Base (Docker)
Abre una terminal en la raíz del proyecto y ejecuta:
```bash
docker compose up --build -d
```
Esto levantará **LocalStack** (emulador de AWS), **Redis** y el servidor de desarrollo del **Frontend**.

### 2. Desplegar la Infraestructura (Backend)
Las funciones Lambda y la base de datos se despliegan utilizando AWS CDK hacia LocalStack. En una terminal, entra a la carpeta de infraestructura y despliega todo:
```bash
cd infrastructure
cdklocal deploy --all --require-approval never
```
*(Este comando compilará el código en Python, creará la tabla en DynamoDB y publicará las rutas en el API Gateway local).*

### 3. Acceder a la Aplicación
Una vez que el CDK termine de desplegar exitosamente:
- **Tienda (Frontend):** `http://localhost:5173`
- **LocalStack (AWS en local):** `http://localhost:4566`

---

## Modelado de Datos (Single Table Design)

| Entidad | Partition Key (pk) | Sort Key (sk) | Propósito |
|---------|----|----|-----------|
| Usuario | `USER#<email>` | `PROFILE` | Información básica del usuario e inicio de sesión |
| Orden | `USER#<email>` | `ORDER#<id>` | Cabecera del pedido e historial de compras |
| Carrito | `USER#<email>` | `CART#<prod>` | Producto guardado temporalmente en el carrito |
| Producto | `CATALOG#main` | `PRODUCT#<id>` | Catálogo general de productos |

---

## Solución de Problemas (Troubleshooting)

Durante el desarrollo hemos documentado las soluciones a los problemas más comunes al momento de desplegar el entorno:

### 1. El comando `cdklocal deploy` pide seleccionar un Stack
**Problema:** Al ejecutar el deploy, aparece el mensaje: *"Since this app includes more than a single stack, specify which stacks to use..."*  
**Solución:** Nuestra infraestructura tiene múltiples componentes (Dynamo, Redis, Lambda). Siempre debes desplegar con el flag `--all` para incluir todas las partes de la arquitectura:
```bash
cdklocal deploy --all
```

### 2. El comando `cdklocal` no se reconoce
**Problema:** La terminal arroja *'cdklocal' command not found*.  
**Solución:** Asegúrate de tener instalado el CLI local de AWS CDK en tu entorno global mediante Node.js:
```bash
npm install -g aws-cdk-local aws-cdk
```

### 3. Falla el despliegue por dependencias de Python (Pip / Virtualenv)
**Problema:** Al hacer `cdklocal deploy`, salen alertas de permisos sobre `pip` o errores de entorno virtual.  
**Solución:** El entorno de CDK usa Python. Asegúrate de tener activado el entorno virtual (`.venv/bin/activate` o `Scripts\activate` en Windows) dentro de la carpeta `infrastructure` antes de hacer el despliegue.

### 4. No veo la información del Caché en el Carrito (Inspector)
**Problema:** Al inspeccionar el carrito en el Frontend, el tiempo de carga es alto o aparece `undefined` en la fuente de datos.  
**Solución:** Verifica que el contenedor de Redis esté corriendo (`docker ps`). Si el contenedor de Redis falla o se apaga, las Lambdas seguirán funcionando (haciendo peticiones directas a DynamoDB como mecanismo de caída), pero perderás la altísima velocidad del caché en memoria (tiempos de ~100ms).
