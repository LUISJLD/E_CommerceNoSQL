FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Espera a que deploy.py haya escrito .env antes de lanzar Vite
CMD sh -c 'echo "Esperando .env del deploy..."; \
  until [ -f /app/.env ]; do sleep 2; done; \
  echo ".env listo → iniciando Vite"; \
  npx vite --host 0.0.0.0'
