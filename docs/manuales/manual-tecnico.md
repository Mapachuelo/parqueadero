# Manual tecnico

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia.
Version 1.1 - octubre de 2026.

## 1. Descripcion general

Aplicacion web para operar parqueaderos publicos: registro de entrada y salida de
vehiculos, calculo automatico de tarifas, pagos, tiquetes/recibos, reportes y
cumplimiento legal (Ley 1801/2016 y Ley 1480/2011).

- Backend: Node.js 22 + Fastify 5 + TypeScript estricto + Prisma 6.
- Frontend: React 19 + Vite 6 + TanStack Router + Tailwind 4 + React Query.
- Base de datos: PostgreSQL 16 (SQLite previsto para modo offline).
- Despliegue: Podman con pods nativos (`kube play`).

Referencias: `docs/ieee830.md` (SRS), `docs/diseno/` (UML, mockups, modelo de
datos), `docs/calidad/` (plan de pruebas y resultados).

## 2. Arquitectura

Monolito modular. Cada modulo en `src/modules/<nombre>/` contiene:

```
<nombre>.router.ts       Rutas Fastify
<nombre>.controller.ts   Handlers HTTP (Zod + service)
<nombre>.service.ts      Logica de negocio
<nombre>.repository.ts   Acceso a datos (Prisma)
<nombre>.schema.ts       Validacion Zod
<nombre>.test.ts         Pruebas unitarias
index.ts                 Exporta el router
```

Los routers se registran en `src/app.ts` (`buildApp()`); `src/server.ts` es el
entrypoint. El frontend vive en `client/` (SPA servida por nginx, que ademas
proxya `/api` al backend). Ver `docs/diseno/uml/componentes.drawio` y
`despliegue.drawio`.

## 3. Requisitos

- Podman (rootless) y `podman kube play`.
- Node.js 22 solo dentro de contenedores (el host no necesita Node).
- Opcional para desarrollo: pnpm 11.
- Certificado TLS para nginx (produccion: `/etc/parqueadero/ssl`).

## 4. Instalacion y ejecucion

### 4.1 Desarrollo local

```bash
pnpm install
cp .env.example .env        # editar secretos reales
pnpm db:migrate             # requiere PostgreSQL local
pnpm db:seed
pnpm dev                    # backend :3000
pnpm dev:client             # SPA :5173 (proxy /api -> :3000)
```

### 4.2 Despliegue con Podman

```bash
# 1. Imagenes (el tag debe ser localhost/...)
podman build -t localhost/parqueadero-backend:latest -f Containerfile.backend .
podman build -t localhost/parqueadero-frontend:latest -f Containerfile.frontend .

# 2. Plantillas y secretos
cp example.db-pod.yaml db-pod.yaml
cp example.app-pod.yaml app-pod.yaml
# editar stringData del Secret parqueadero-secrets en db-pod.yaml

# 3. Red y pods
podman network create parqueadero-net      # una vez
podman kube play --replace --network parqueadero-net db-pod.yaml
podman kube play --replace --network parqueadero-net app-pod.yaml

# 4. Migraciones y seed (manual)
podman run --rm --network parqueadero-net \
  -e DATABASE_URL='postgresql://parqueadero:<password>@parqueadero-db:5432/parqueadero' \
  localhost/parqueadero-backend:latest \
  sh -c "node_modules/.bin/prisma migrate deploy && node dist/db/seeds/index.js"
```

La aplicacion queda en `https://localhost:3001`. El seed imprime las claves
aleatorias de `admin` y `operador` una sola vez.

### 4.3 Detener

```bash
podman kube down app-pod.yaml db-pod.yaml
```

Los volumenes (`parqueadero-pgdata`, `uploads`, `backups`) se preservan.

## 5. Variables de entorno

| Variable | Regla |
|----------|-------|
| `DATABASE_URL` | URL PostgreSQL; no puede contener placeholders |
| `JWT_SECRET` | >= 32 caracteres |
| `JWT_EXPIRATION_MINUTES` | 30 por defecto |
| `PLATE_ENCRYPTION_KEY` | 64 caracteres hex exactos |
| `SYNC_API_KEY` | >= 16 caracteres |
| `PORT` / `NODE_ENV` | 3000 / development,production,test |
| `SMTP_*` | Correo saliente (opcional) |
| `UPLOAD_DIR` / `BACKUP_DIR` | Rutas de archivos y respaldos |

El backend valida todo al arrancar (`src/config/env.ts`) y se detiene si algo
falta o es placeholder.

## 6. Base de datos

- Esquema oficial: `src/db/prisma/schema.prisma` (29 entidades; hay symlink
  `prisma/schema.prisma`).
- Migracion unica: `prisma/migrations/20260522181540_init`.
- Diccionario de datos: `docs/diseno/datos/diccionario-datos.md`.
- ER y DBML: `docs/diseno/datos/`.
- Seeds: usuarios, tarifas, espacios, configuracion y terminos legales.

Regenerar el diccionario/ER tras cambiar el schema:

```bash
python3 docs/diseno/tools/generar-datos.py
```

## 7. API REST

Documentacion interactiva en `/docs` (Swagger UI) y JSON en `/docs/json`.
Endpoints principales:

- `POST /api/auth/login`, `/logout`, `GET /session`, `POST /register` (admin),
  `GET /api/auth/users` (admin).
- `POST /api/transactions/entry`, `GET /active`, `GET /:id`, `POST /:id/exit`.
- `POST /api/payments`.
- Tarifas, legal, reclamos, reportes, espacios, perfil, cliente y sync
  (ver `.agents/skills/architecture.md`).

Autenticacion: JWT Bearer + sesion en `user_sessions`. Roles: admin, operador,
cliente (RBAC con `roleGuard`).

## 8. Seguridad

- Contrasenas con bcrypt (salt 12); bloqueo tras 3 intentos (30 min).
- Placas cifradas con AES-256-GCM + hash SHA-256 para busqueda.
- HTTPS obligatorio en nginx (TLS 1.2/1.3).
- Helmet, rate limiting por endpoint y logs de auditoria (`audit_logs`).
- Secretos solo en el Secret de Podman o `.env` local; nunca en git.

## 9. Pruebas

Ver `docs/calidad/plan-de-pruebas.md`. Resumen:

```bash
# Unitarias + cobertura
podman run --rm --security-opt label=disable -v "$PWD:/app" -w /app \
  docker.io/library/node:22 node_modules/.bin/vitest run --coverage
# Integracion (PostgreSQL efimero)
bash scripts/test-integration.sh
# E2E (Chromium)
podman run --rm --security-opt label=disable --network host -v "$PWD:/app" -w /app \
  -e E2E_BASE_URL=https://localhost:3001 -e E2E_ADMIN_PASSWORD -e E2E_OPERATOR_PASSWORD \
  -e E2E_CLIENT_EMAIL -e E2E_CLIENT_PASSWORD \
  mcr.microsoft.com/playwright:v1.55.0-noble npx playwright test
```

## 10. Mantenimiento

- Actualizar dependencias: editar `package.json` y correr pnpm en un contenedor.
- Nuevas migraciones: `prisma migrate dev` y `prisma migrate deploy` en despliegue.
- Backups: job `src/jobs/backup-daily.ts` + volumen `parqueadero-backups`.
- Logs: `podman logs parqueadero-app-backend` y tabla `audit_logs`.

## 11. Solucion de problemas

| Sintoma | Causa probable | Solucion |
|---------|----------------|----------|
| nginx no arranca | certificado TLS ilegible (SELinux) | `chcon -R -t container_file_t ssl` |
| Backend se detiene al arrancar | secretos placeholder o cortos | revisar Secret/.env |
| 401 tras reiniciar BD | sesiones borradas | volver a iniciar sesion |
| `EADDRINUSE` en 3001 | otro servicio usa el puerto | liberar el puerto o cambiar `hostPort` |
| Tests con error de engine Prisma | cliente generado para otra plataforma | `prisma generate` en el contenedor |

## 12. Referencias

- SRS: `docs/ieee830.md`
- Diseno: `docs/diseno/README.md`
- Calidad: `docs/calidad/`
- Arquitectura detallada: `.agents/skills/architecture.md`
- Despliegue: `README.md`
