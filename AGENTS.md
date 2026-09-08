# AGENTS.md

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia. Monorepo pnpm: la raiz es el backend Fastify (TypeScript estricto) y `client/` es el SPA React 19 (Vite, TanStack Router, Tailwind 4, React Query, react-hook-form + Zod).

## Comandos

```bash
pnpm install        # .npmrc tiene ignore-scripts=true: si @prisma/client falla, correr pnpm db:generate
pnpm dev            # Backend con tsx watch en :3000
pnpm dev:client     # Frontend en :5173 (vite.config.ts proxya /api -> :3000)
pnpm build          # Backend: tsc a dist/ (el deploy corre dist/, no TS)
pnpm build:client   # Frontend
pnpm test           # Vitest: los tests viven junto al codigo (src/modules/**/*.test.ts)
pnpm test:coverage  # Cobertura
pnpm lint           # ESLint (raiz: src/ ; client: pnpm --filter @parqueadero/client lint)
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier sobre src/
pnpm db:generate | db:migrate | db:seed | db:studio   # Prisma
```

GOTCHA: `pnpm test:integration` esta roto (referencia `vitest.integration.config.ts` que no existe y `src/tests/integration` esta vacio). No usarlo; los tests unitarios estan colocalizados y usan la config por defecto de Vitest.

## Arquitectura

- Backend: monolith modular. Cada modulo en `src/modules/<nombre>/` con `<nombre>.router.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.schema.ts` (Zod), `index.ts` (exporta el router). Todos los routers se registran en `src/app.ts` (fabrica `buildApp()`); `src/server.ts` es el entrypoint.
- Prisma schema en `prisma/schema.prisma` (PostgreSQL). Una sola migracion: `20260522181540_init`.
- Swagger auto-generado desde schemas Zod en `/docs` (puerto 3000 local, 3001 en produccion).
- Client: TanStack Router genera `client/src/routeTree.gen.ts` via plugin de Vite — no editar a mano; se regenera en dev/build. Alias `@` -> `client/src`.
- Referencia completa de API y stack en `.agents/skills/architecture.md`. OJO: ese documento esta parcialmente desactualizado (los pods YAML estan en la raiz como `app-pod.yaml`/`db-pod.yaml`, no en `podman/`; el schema Prisma esta en `prisma/`, no en `src/db/prisma/`).

## Variables de entorno

- `.env.example` -> `.env` para desarrollo local. El backend rechaza placeholders (`CAMBIAR_POR_*`, `cambiar-por-*`, `CHANGE_ME`) al arrancar (validacion en `src/config/env.ts`).
- Reglas de longitud: `JWT_SECRET` >= 32 chars, `PLATE_ENCRYPTION_KEY` exactamente 64 chars hex, `SYNC_API_KEY` >= 16 chars, `DB_PASSWORD` >= 16 chars y URL-safe (sin `+`, `/`, `=`; base64url).
- `NODE_ENV=test` inyecta valores dummy automaticamente (no requiere .env real para tests).

## Despliegue (Podman pods)

- Config unica en `.env`: sus valores se inyectan (envsubst) en las plantillas `db-pod.yaml`/`app-pod.yaml` y se ejecuta `podman kube play` sobre la red interna `parqueadero-net`. Sin archivos example ni secretos commiteados.
- Imagenes: `podman build -t parqueadero-backend:latest -f Containerfile.backend .` y `-t parqueadero-frontend:latest -f Containerfile.frontend .`
- Generar claves: `DB_PASSWORD` (base64url, >= 16), `JWT_SECRET` (>= 32), `PLATE_ENCRYPTION_KEY` (64 hex exactos), `SYNC_API_KEY` (>= 16). Los certificados TLS del frontend se administran por fuera (montados desde `/etc/parqueadero/ssl` en el host).
- `.env` esta en `.gitignore`. NUNCA commitearlo. Los YAML `db-pod.yaml`/`app-pod.yaml` son plantillas sin secretos y si se commitean.
- Levantar: `podman network create parqueadero-net` (una vez), luego `set -a; source .env; set +a` y `envsubst < db-pod.yaml | podman kube play --replace --network parqueadero-net -` (igual con `app-pod.yaml`). App en `https://localhost:3001`; ver credenciales del primer arranque con `podman logs -f parqueadero-app`.
- Red interna: los pods solo se exponen entre si por DNS de podman (`parqueadero-db:5432`); el unico puerto al host es el frontend (3001, HTTPS). Backend (3000) y postgres (5432) quedan internos.
- Detener: `podman kube down app-pod.yaml db-pod.yaml`. Los volumenes (BD, uploads, backups) se preservan entre reinicios.
- El backend arranca con `CMD ["node", "dist/server.js"]` (migraciones y seeds son manuales): compilar con `pnpm build` antes de deployar.
- CI (`version-tar.yml`): push a main con >= 3 commits desde el ultimo tag genera tag `v1.0.x` + release (o con workflow_dispatch manual).

## Convenciones

- Todo en espanol: docs, mensajes de error y UI en es-CO, commits descriptivos en presente. Fechas UTC-5, moneda COP.
- Sin emojis. No agregar comentarios al codigo salvo que el usuario los pida.
- Despues de cambios de codigo: `pnpm lint` + `pnpm typecheck`; correr `pnpm test` si el cambio es significativo.
- Al final de cada sesion, guardar el estado/pendientes en `.agents/notes/memory.md` (reglas completas en `.agents/skills/skill.md`).
- No commitear sin pedido explicito; stagear solo los archivos intencionados, nunca secretos.