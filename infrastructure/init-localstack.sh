#!/bin/bash
set -e

echo "[init] Ejecutando deploy..."
python3 /etc/localstack/init/ready.d/01_deploy.py

echo "[init] Ejecutando seed..."
python3 /etc/localstack/init/ready.d/02_seed.py

# Pre-calentar Lambdas secuencialmente para evitar saturar Docker
echo "[init] Calentando Lambdas..."
API_ID=$(grep VITE_API_ID /app/client/.env 2>/dev/null | cut -d= -f2)
if [ -n "$API_ID" ]; then
  BASE="http://localhost:4566/restapis/${API_ID}/prod/_user_request_"

  warmup() {
    curl -s "$1" > /dev/null 2>&1 || true
    sleep 3
  }

  warmup "$BASE/products"
  warmup "$BASE/users"
  warmup "$BASE/admin/orders"
  warmup "$BASE/admin/products"

  echo "[init] ⚡ Lambdas calientes"
fi

echo "[init] ✅ Infraestructura lista."
