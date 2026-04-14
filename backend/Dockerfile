FROM python:3.12

# Directorio de trabajo
WORKDIR /app

# Instalación de dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia de todo el código del proyecto
COPY . .

# Exponemos el puerto de Django
EXPOSE 8000

# Comando automatizado: 
# 1. Espera un momento para que DynamoDB Local inicie
# 2. Crea la tabla con el esquema PK/SK y GSI1
# 3. Inserta los datos de prueba (seed)
# 4. Inicia Django
CMD sh -c "sleep 5 && python create_table.py && python seed-data.py && python manage.py runserver 0.0.0.0:8000"