#!/bin/bash
set -e

echo "[init] Ejecutando deploy..."
python3 /etc/localstack/init/ready.d/01_deploy.py

echo "[init] Ejecutando seed..."
python3 /etc/localstack/init/ready.d/02_seed.py

# Pre-calentar Lambdas (cold start en background para que estén listas cuando el frontend cargue)
echo "[init] Calentando Lambdas..."
API_URL=$(grep VITE_API_URL /app/client/.env 2>/dev/null | cut -d= -f2)
if [ -n "$API_URL" ]; then
  BASE="http://localhost:4566${API_URL#/localstack}"
  curl -s "$BASE/products" > /dev/null 2>&1 &
  curl -s "$BASE/cart/warmup" > /dev/null 2>&1 &
  curl -s "$BASE/user/warmup/orders" > /dev/null 2>&1 &
  wait
  echo "[init] ⚡ Lambdas calientes"
fi

echo "[init] ✅ Infraestructura lista."
