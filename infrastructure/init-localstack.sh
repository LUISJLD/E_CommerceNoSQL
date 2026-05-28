#!/bin/bash
set -e

echo "[init] Ejecutando deploy..."
python3 /etc/localstack/init/ready.d/01_deploy.py

echo "[init] Ejecutando seed..."
python3 /etc/localstack/init/ready.d/02_seed.py

echo "[init] ✅ Infraestructura lista."
