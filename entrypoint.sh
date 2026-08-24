#!/bin/sh
set -e

echo "== Parqueadero App =="

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

is_placeholder() {
  case "$1" in
    *CAMBIAR_POR_* | *cambiar-por-* | *CHANGE_ME*) return 0 ;;
    *) return 1 ;;
  esac
}

[ -n "$DATABASE_URL" ] || fail "DATABASE_URL no configurado"
[ -n "$JWT_SECRET" ] || fail "JWT_SECRET no configurado"
[ -n "$PLATE_ENCRYPTION_KEY" ] || fail "PLATE_ENCRYPTION_KEY no configurado"
[ -n "$SYNC_API_KEY" ] || fail "SYNC_API_KEY no configurado"

if is_placeholder "$DATABASE_URL" || is_placeholder "$JWT_SECRET" || is_placeholder "$PLATE_ENCRYPTION_KEY" || is_placeholder "$SYNC_API_KEY"; then
  fail "Los secretos contienen valores placeholder (CAMBIAR_POR_*). Configure claves reales antes de iniciar."
fi

LEN_JWT=${#JWT_SECRET}
LEN_PLATE=${#PLATE_ENCRYPTION_KEY}
LEN_SYNC=${#SYNC_API_KEY}

[ "$LEN_JWT" -ge 32 ] || fail "JWT_SECRET debe tener al menos 32 caracteres (actual: $LEN_JWT)"
[ "$LEN_PLATE" -eq 64 ] || fail "PLATE_ENCRYPTION_KEY debe tener exactamente 64 caracteres hex (actual: $LEN_PLATE)"
[ "$LEN_SYNC" -ge 16 ] || fail "SYNC_API_KEY debe tener al menos 16 caracteres (actual: $LEN_SYNC)"

echo "Secretos validados correctamente."

echo "Esperando PostgreSQL..."
until ./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma 2>/dev/null; do
  echo "Reintentando conexion a PostgreSQL..." && sleep 3
done
echo "Migraciones aplicadas."

echo "Ejecutando bootstrap de datos iniciales..."
node dist/db/seeds/index.js

echo "Iniciando servidor..."
exec node dist/server.js