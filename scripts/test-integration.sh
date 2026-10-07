#!/usr/bin/env bash
# Ejecuta los tests de integracion contra un PostgreSQL efimero en Podman.
# No usa node del host: todo corre dentro de contenedores.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NET="parqueadero-test-net"
DB="parqueadero-test-db"
NODE_IMAGE="docker.io/library/node:22"

cleanup() {
  podman rm -f "$DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

podman network exists "$NET" >/dev/null 2>&1 || podman network create "$NET" >/dev/null

podman rm -f "$DB" >/dev/null 2>&1 || true
podman run -d --name "$DB" --network "$NET" \
  -e POSTGRES_USER=parqueadero \
  -e POSTGRES_PASSWORD=parqueadero \
  -e POSTGRES_DB=parqueadero \
  docker.io/library/postgres:16 >/dev/null

echo "Esperando PostgreSQL..."
for _ in $(seq 1 30); do
  if podman exec "$DB" pg_isready -U parqueadero >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Ejecutando migraciones, seed y tests de integracion..."
podman run --rm --security-opt label=disable --network "$NET" \
  -v "$ROOT:/app" -w /app \
  -e DATABASE_URL="postgresql://parqueadero:parqueadero@${DB}:5432/parqueadero" \
  -e NODE_ENV=test \
  "$NODE_IMAGE" sh -c "
    export PATH=/app/node_modules/.bin:\$PATH &&
    prisma generate &&
    prisma migrate deploy &&
    tsx src/db/seeds/index.ts &&
    vitest run --config vitest.integration.config.ts
  "
