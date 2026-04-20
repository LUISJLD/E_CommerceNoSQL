#!/bin/sh

# Esperar a que DynamoDB esté disponible (opcional pero recomendado)
echo "Esperando a que DynamoDB inicie..."
sleep 5

# Ejecutar la creación de la tabla y el llenado de datos
echo "Configurando base de datos NoSQL..."
python create_table.py
python seed-data.py

# Iniciar el servidor de Django
echo "Iniciando servidor Django..."
python manage.py runserver 0.0.0.0:8000