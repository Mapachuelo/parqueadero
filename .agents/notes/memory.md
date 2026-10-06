# Memoria de desarrollo

## Sesion: 21 mayo 2026

### Inicializacion del proyecto
- Proyecto: Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia
- Documento SRS: `docs/ieee830.md` (IEEE 830-1998, version 1.0)
- Stack definido: Node.js + TypeScript, pnpm v11, React, PostgreSQL + SQLite, Podman

### Estructura creada
- `.agents/skills/architecture.md`: Stack tecnologico, comandos, estructura del proyecto, convenciones, seguridad, testing y git workflow
- `.agents/skills/skill.md`: Reglas de comportamiento del agente y documentacion
- `opencode.json`: Registro de la skill para opencode
- `db/sync_strategy.md`: Estrategia de sincronizacion offline-online (ya existente)

### Actualizaciones 21 mayo 2026 (segunda sesion)
- `docs/prompts.md`: Prompt completo de arquitectura backend desde cero (896 lineas), con stack, estructura, fases de inicializacion, esquema Prisma, implementacion por modulos en 7 sprints, middleware, seguridad y testing
- `.agents/skills/architecture.md`: Actualizado de 120 a 359 lineas con:
  - Stack definido: Fastify (no Express), Prisma (no Drizzle), Zod para validacion, date-fns con locale es-CO
  - Patron de arquitectura: modular monolith con router/controller/service/repository/schema por modulo
  - Modulos agregados: payments, claims, client, spaces
  - Tabla completa de API REST con 50+ endpoints
  - Manejo de errores con AppError
  - Sincronizacion offline vinculada a db/sync_strategy.md
  - Variables de entorno requeridas
  - Rate limiting mapeado a endpoints especificos
  - Planificacion de 7 sprints con RF cubiertos

### Stack tecnologico definitivo
- Backend: Node.js + Fastify + TypeScript (strict)
- ORM: Prisma (PostgreSQL + SQLite)
- Validacion: Zod
- Hashing: bcrypt (salt rounds=12)
- Cifrado: AES-256-GCM (placas)
- Fechas: date-fns + es-CO (UTC-5)
- Testing: Vitest
- Contenedores: Podman + podman-compose (PostgreSQL 16)

### Pendientes
- Iniciar el desarrollo del MVP (8-12 semanas)
- Sprint 1: Inicializar proyecto (pnpm + TS + Fastify + Prisma) + modulo auth
- Configurar Podman con PostgreSQL para desarrollo local
- Crear schema.prisma basado en db/postgresql_schema.sql

## Sesion: 27 septiembre 2026

### Objetivo
Bucle E2E del flujo operador (login -> entrada -> activos -> salida/pago) sobre los pods Podman, verificando con Chromium (Playwright MCP). Corregir en codigo y repetir desde 0 hasta que pasara.

### Entorno de prueba montado
- Pods `parqueadero-db` (postgres:16) y `parqueadero-app` (backend + frontend nginx) en red `parqueadero-net`. Web en `https://localhost:3001`.
- Imagenes: `localhost/parqueadero-backend:latest` y `localhost/parqueadero-frontend:latest` (build con los Containerfile).
- Secretos reales escritos a mano en `db-pod.yaml` (gitignored). `app-pod.yaml` (gitignored) ahora monta TLS desde `./ssl` (ruta absoluta del repo) en vez de `/etc/parqueadero/ssl`, que no existia.
- Cert autofirmado local en `ssl/` (CN=localhost). Requiere `chcon -R -t container_file_t ssl` para SELinux, y esta importado en `~/.pki/nssdb` con `certutil` para que Chromium lo confie. Tambien se agrego `--ignore-https-errors` al MCP `playwright` en `~/.config/opencode/opencode.json`.
- Reset desde 0 por iteracion: `podman kube down`, `podman volume rm -f parqueadero-pgdata`, replay `db-pod.yaml`, migrar+seed con contenedor one-off (`node_modules/.bin/prisma migrate deploy && node dist/db/seeds/index.js`), replay `app-pod.yaml`.
- El seed imprime credenciales aleatorias de `admin`/`operador` una sola vez (se capturan de stdout).

### Bugs encontrados y corregidos
1. Ticket de entrada mostraba Placa/Categoria/Cliente vacios. `registerEntry` (`src/modules/transactions/transactions.service.ts`) no devolvia `plate`, `category`, `customer_name`. Se agregaron (mas `id`, `customer_phone`, `status`, ticket completo).
2. El paso de pago pedia el detalle con `GET /api/transactions/:id` usando el id numerico, que el backend no resuelve (busca por `transaction_id` o hash de placa) -> 404 y total en $0. Se elimino esa consulta en `client/src/components/SalidaForm.tsx`.
3. La salida no registraba el exit antes de pagar, y `paymentsService.processPayment` exige `exit_time` -> 400. Se agrego `exitMutation` que llama `transactionsApi.exit(transaction_id)` al buscar el vehiculo y entra al paso de pago solo con la respuesta.
4. El recibo leia campos planos de `Payments`, pero la API devuelve `{ receipt, change_amount, payment_id }`. Se corrigio `client/src/lib/api.ts` (tipos `ExitResult`, `PaymentReceipt`, `PaymentResult`) y `SalidaForm` para usar `response.data.receipt`.

### Resultado
- E2E verde: entrada TXN-20260927-00001, duracion 120 min, tarifa 5000/h, total/final 10000, pago efectivo 20000 con cambio 10000, espacio A-001 liberado, tickets `entrada` y `salida` generados, `0` errores de consola.
- Evidencia visual en `e2e/*.png` (login, ticket corregido, activos, pago, recibo).

### Verificacion
- `node_modules/.bin/tsc --noEmit` (raiz y client) OK; eslint raiz solo warnings preexistentes.
- `vitest run`: 36 tests pasan. 2 errores de entorno: el engine de Prisma quedo generado para `debian-openssl-3.0.x` y el host pide `rhel-openssl-3.0.x` (no relacionado con estos cambios).
- En el host no hay `pnpm` en PATH; usar `node_modules/.bin/...`.

### Problemas conocidos / pendientes
- README dice credenciales `admin/123456` y `.env` define `SEED_ADMIN_PASSWORD`/`SEED_OPERADOR_PASSWORD`, pero `users.seed.ts` los ignora y genera claves aleatorias. Definir cual es el comportamiento correcto.
- El engine de Prisma del host (binaryTargets) rompe los tests que tocan BD local.
- Falta cubrir el resto de modulos: reportes, tarifas, reclamos, legal, espacios, usuarios y el rol admin.

## Sesion: 27 septiembre 2026 (roles admin y cliente)

### Objetivo
Probar los 3 roles (admin, operador, cliente) en los pods con Chromium. Implementar el rol cliente que no era usable. Mismo bucle estricto: corregir, reconstruir imagen, reset de BD desde 0 y repetir.

### Cambios de codigo (rol cliente)
- `src/modules/auth/auth.schema.ts`: `registerSchema` ahora acepta `Role.CLIENTE`.
- `src/modules/transactions/transactions.schema.ts`: `entrySchema` acepta `customerEmail` (email opcional).
- `src/modules/transactions/transactions.repository.ts`: `createTransaction` acepta `customer_email`.
- `src/modules/transactions/transactions.service.ts`: guarda `customer_email` y lo devuelve en la entrada.
- `client/src/lib/api.ts`: `transactionsApi.entry` acepta `customerEmail`.
- `client/src/components/EntradaForm.tsx`: campo "Correo electrónico (opcional, portal cliente)".
- `client/src/routes/login.tsx`: el rol cliente ahora redirige a `/_cliente` (antes `/_cliente/historial`, ruta inexistente).
- `client/src/routes/_admin.usuarios.tsx`: opcion de rol Cliente y consumo del nuevo endpoint.

### Bugs encontrados y corregidos en esta sesion
5. Admin "Usuarios" siempre decia "No hay usuarios registrados": la pagina leia `reportsApi.users()` (que devuelve `{ operators }`) como si fuera un array. Se agrego `GET /api/auth/users` (admin) en `auth.repository/service/controller/router` y `authApi.listUsers` en el cliente.
6. Portal cliente no listaba transacciones: leia `data.data.transactions` pero el backend devuelve `data.data.data`. Corregido en `client/src/lib/api.ts` y `_cliente.index.tsx`.
7. Portal cliente mostraba "Activo"/sin duracion: leia `transaction.duration` y el backend entrega `duration_minutes`. Se agrego `duration_minutes` al tipo y se usa `duration ?? duration_minutes`. Tambien se corrigio el bloque Ticket (usa `tickets[]` y tipos `entrada`/`salida`).

### Resultado por rol
- Admin: login, dashboard (ingresos $15.000), tarifas (4 pestanas), reportes (ocupacion, ingresos, transacciones, usuarios, compliance), reclamos (nota, cambiar estado, resolver), legal (terminos + checklist), espacios, usuarios (listar y crear), y entrada/salida/activos. Todo OK.
- Operador: acceso a entrada/salida/activos y endpoints permitidos (200). Endpoints admin (`reports/revenue`, `rates/structures`, `legal/checklist`, `auth/users`) dan 403; el frontend lo reenvia a su area.
- Cliente: admin crea usuario rol cliente con email; la entrada guarda `customer_email`; el portal `/_cliente` lista la transaccion por "Acceso con Cuenta" y por "Acceso por Transaccion" (transaccion + ultimos 4 alfanumericos de la placa, p.ej. `ABC-123` -> `C123`), filtros por fecha OK, duracion y total correctos.
- Nota: el ultimo paso probado del portal ("Descargar Recibo") abre `window.print()`; el dialogo nativo de impresion bloqueo el navegador de Playwright y la herramienta MCP quedo no disponible para esta sesion. Requiere reiniciar opencode para restaurar Chromium. El resto del portal quedo verificado.

### Normalizacion extra
- `client.service.ts` `authenticateByTransaction` ahora normaliza placa y ultimos 4 (quita no alfanumericos) antes de comparar.
- `client.schema.ts` `from`/`to` pasan a `z.string()` (antes `z.string().datetime()`), porque el portal envia `YYYY-MM-DD`.

### Puntos abiertos (gaps de producto, no errores)
- No hay UI para crear reclamos (`claimsApi.create` solo por API) ni para crear checklists legales; el seed solo crea terminos de custodia.
- La entrada aun no captura telefono/email obligatorios; el email es opcional.

### Verificacion
- `tsc --noEmit` raiz y client OK; eslint raiz solo warnings preexistentes.
- API final: `GET /api/auth/users` devuelve operador/cliente1/admin; portal cliente devuelve la transaccion (120 min, final 10000).
- Imagenes: `localhost/parqueadero-backend:latest` y `localhost/parqueadero-frontend:latest` reconstruidas; pods `parqueadero-db` + `parqueadero-app` arriba.

