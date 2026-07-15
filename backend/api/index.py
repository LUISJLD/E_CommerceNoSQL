# api/index.py
# Punto de entrada que Vercel espera encontrar en la carpeta api/
# Vercel enruta todas las requests a este archivo gracias a vercel.json

from main import app  # noqa: F401 — Vercel usa la variable 'app' como handler ASGI
