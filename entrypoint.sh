#!/bin/sh
set -e

echo "== Parqueadero App =="
echo "Esperando PostgreSQL..."
until npx prisma db push --schema=prisma/schema.prisma --skip-generate 2>/dev/null; do
  echo "Reintentando conexion a PostgreSQL..."
  sleep 3
done

echo "Base de datos sincronizada."

echo "Ejecutando seed de datos iniciales..."
node dist/db/seeds/index.js

echo "Iniciando servidor..."
exec node dist/server.js
