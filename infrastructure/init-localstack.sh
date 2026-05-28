#!/bin/bash
set -e

echo "[init] Ejecutando deploy..."
python3 /etc/localstack/init/ready.d/01_deploy.py

echo "[init] Ejecutando seed..."
python3 /etc/localstack/init/ready.d/02_seed.py

# Pre-calentar todas las Lambdas para eliminar cold starts
echo "[init] Calentando Lambdas..."
API_ID=$(grep VITE_API_ID /app/client/.env 2>/dev/null | cut -d= -f2)
if [ -n "$API_ID" ]; then
  BASE="http://localhost:4566/restapis/${API_ID}/prod/_user_request_"

  # Invocar cada lambda para que LocalStack cree su contenedor
  curl -s "$BASE/products"                      > /dev/null 2>&1 &
  curl -s "$BASE/users"                         > /dev/null 2>&1 &
  curl -s "$BASE/cart/warmup"                   > /dev/null 2>&1 &
  curl -s "$BASE/user/warmup/orders"            > /dev/null 2>&1 &
  curl -s "$BASE/orders/warmup/items"           > /dev/null 2>&1 &
  curl -s "$BASE/admin/orders"                  > /dev/null 2>&1 &
  curl -s "$BASE/admin/products"                > /dev/null 2>&1 &
  curl -s -X POST "$BASE/auth/login" \
       -H "Content-Type: application/json" \
       -d '{"email":"warmup","password":"warmup"}' > /dev/null 2>&1 &

  wait
  echo "[init] ⚡ Lambdas calientes"
fi

echo "[init] ✅ Infraestructura lista."
