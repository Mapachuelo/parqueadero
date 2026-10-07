# AGENTS.md

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia. Monorepo pnpm: la raiz es el backend Fastify (TypeScript estricto) y `client/` es el SPA React 19 (Vite, TanStack Router, Tailwind 4, React Query, react-hook-form + Zod).

## Comandos

```bash
pnpm install        # .npmrc tiene ignore-scripts=true: si @prisma/client falla, correr pnpm db:generate
pnpm dev            # Backend con tsx watch en :3000
pnpm dev:client     # Frontend en :5173 (vite.config.ts proxya /api -> :3000)
pnpm build          # Backend: tsc a dist/ (el deploy corre dist/, no TS)
pnpm build:client   # Frontend
pnpm test           # Vitest: tests colocalizados (src/**/*.test.ts)
pnpm test:coverage  # Cobertura con umbrales (vitest.config.ts)
pnpm test:integration # PostgreSQL efimero en Podman (scripts/test-integration.sh)
pnpm test:e2e       # Playwright contra https://localhost:3001
pnpm lint           # ESLint (raiz: src/ ; client: pnpm --filter @parqueadero/client lint)
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier sobre src/
pnpm db:generate | db:migrate | db:seed | db:studio   # Prisma
```

GOTCHA: en este host no hay `pnpm` ni se debe usar `node` del host; ejecutar las herramientas dentro de contenedores (`podman run ... node_modules/.bin/vitest`) o usar los scripts (que ya usan Podman). Los E2E corren en la imagen `mcr.microsoft.com/playwright`.

## Arquitectura

- Backend: monolith modular. Cada modulo en `src/modules/<nombre>/` con `<nombre>.router.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.schema.ts` (Zod), `index.ts` (exporta el router). Todos los routers se registran en `src/app.ts` (fabrica `buildApp()`); `src/server.ts` es el entrypoint.
- Prisma schema real en `src/db/prisma/schema.prisma` (hay symlink `prisma/schema.prisma`; PostgreSQL). Una sola migracion: `20260522181540_init`.
- Swagger auto-generado desde schemas Zod en `/docs` (puerto 3000 local, 3001 en produccion).
- Client: las rutas usan `createRoute` y se ensamblan a mano en `client/src/routeTree.gen.ts` (el plugin de TanStack Router NO esta en `vite.config.ts`, no se regenera solo). Alias `@` -> `client/src`.
- Roles: admin, operador y cliente. El registro (`POST /api/auth/register`) acepta los tres; la entrada acepta `customerEmail` opcional para asociar el portal cliente. `GET /api/auth/users` (admin) lista usuarios.
- Referencia completa de API y stack en `.agents/skills/architecture.md` (actualizada).

## Variables de entorno

- `.env.example` -> `.env` para desarrollo local. El backend rechaza placeholders (`CAMBIAR_POR_*`, `cambiar-por-*`, `CHANGE_ME`) al arrancar (validacion en `src/config/env.ts`).
- Reglas de longitud: `JWT_SECRET` >= 32 chars, `PLATE_ENCRYPTION_KEY` exactamente 64 chars hex, `SYNC_API_KEY` >= 16 chars.
- `NODE_ENV=test` inyecta valores dummy automaticamente (no requiere .env real para tests).

## Despliegue (Podman pods)

- Flujo manual: se copian las plantillas `example.app-pod.yaml`/`example.db-pod.yaml` a `app-pod.yaml`/`db-pod.yaml` y se editan los secretos a mano en el `stringData` del Secret `parqueadero-secrets` (dentro de `db-pod.yaml`).
- Imagenes: `podman build -t localhost/parqueadero-backend:latest -f Containerfile.backend .` y `-t localhost/parqueadero-frontend:latest -f Containerfile.frontend .` (el tag debe ser `localhost/...` porque asi lo referencian los pods).
- Generar claves: `db_password` (base64url, >= 16), `jwt_secret` (>= 32), `plate_encryption_key` (64 hex exactos), `sync_api_key` (>= 16). Los certificados TLS del frontend se administran por fuera (produccion: montados desde `/etc/parqueadero/ssl`; en local se puede usar `./ssl` con cert autofirmado + `chcon -R -t container_file_t ssl`).
- `app-pod.yaml` y `db-pod.yaml` estan en `.gitignore` (contienen secretos reales). NUNCA commitearlos. Los `example.*.yaml` son plantillas sin secretos y si se commitean; re-copiarlas si cambia la imagen o la estructura.
- Levantar: `podman network create parqueadero-net` (una vez), luego `podman kube play --replace --network parqueadero-net db-pod.yaml` y `podman kube play --replace --network parqueadero-net app-pod.yaml`. App en `https://localhost:3001`. Migraciones y seed son manuales (contenedor one-off: `node_modules/.bin/prisma migrate deploy && node dist/db/seeds/index.js`); el seed imprime las credenciales aleatorias de admin/operador una sola vez (no hay credenciales fijas).
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