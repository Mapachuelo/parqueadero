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
- README dice credenciales `admin/123456` y `.env` define `SEED_ADMIN_PASSWORD`/`SEED_OPERADOR_PASSWORD`, pero `users.seed.ts` los ignora y genera claves aleatorias. Definir cual es el comportamiento correcto. (Resuelto el 5 oct 2026: seed siempre aleatorio; se quitaron las `SEED_*` y el README se corrigio.)
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

## Sesion: 5 octubre 2026 (auditoria de entregables + actualizacion de docs)

### Objetivo
Auditar el repositorio contra los 6 entregables del proyecto formativo (IEEE 830, diseno tecnico con mockups/UML, implementacion de datos vs UML, producto final, testing y manuales ES/EN) y actualizar los archivos desactualizados.

### Veredicto por entregable
1. Analisis de Requerimientos IEEE 830: CUMPLE (con ajustes). `docs/ieee830.md` completo; faltan seccion 1.4, el `RF-SALIDA-003` (salto de numeracion) y matriz de trazabilidad completa (RF/RNF/test).
2. Diseno Tecnico (mockups + UML): NO CUMPLE. `docs/trabajo.drawio` vacio; sin UML ni mockups.
3. Implementacion de Datos vs UML: PARCIAL. Prisma (29 modelos) + migracion OK; `db/postgresql_schema.sql` no incluia `mv_daily_occupancy`/`mv_daily_revenue`; no hay ER/UML para comparar.
4. Producto Final: CUMPLE (MVP funcional verificado). Brechas: offline real (SQLite/SQLCipher), impresion termica/PDF, notificaciones email, UI de reclamos/checklist, exportaciones.
5. Verificacion y Calidad: NO CUMPLE. 5 archivos de test / 36 tests; sin integracion ni E2E versionados; cobertura ~5.5%; sin matriz RF-test.
6. Documentacion de Soporte: NO CUMPLE. Solo README; sin manual tecnico ni de usuario.

### Decisiones del usuario para cerrar brechas
- UML en draw.io editable; mockups nuevos.
- Testing: 80% en modulos criticos + tests de integracion + E2E Playwright (operador, admin, cliente).
- Manuales en espanol y Markdown (tecnico + usuario + guia rapida).
- Orden: cerrar primero los 3 faltantes (UML/mockups, testing, manuales), luego datos y ajustes IEEE 830.
- Inconsistencia de credenciales: el seed SIEMPRE genera claves aleatorias (se quitaron `SEED_*` del `.env` local; README lo documenta).

### Archivos actualizados en esta sesion
- `.agents/skills/architecture.md`: stack real (React 19, PG 16, Node 22), `app.ts`, plugins reales (sin compress; CORS `origin: true`), pods en la raiz, tests colocalizados, comandos reales, API con `GET /api/auth/users` y rol cliente, seccion de entorno local de pruebas y estado del MVP.
- `README.md`: seed aleatorio (sin tabla `admin/123456`), migraciones/seed manuales, tags `localhost/parqueadero-*`, TLS local `./ssl`, seccion de 3 roles y portal cliente.
- `AGENTS.md`: schema real + symlink, `routeTree.gen.ts` manual (sin plugin), roles/cliente, tags de imagen, credenciales del seed, TLS local.
- `db/postgresql_schema.sql`: se agregaron `mv_daily_occupancy` y `mv_daily_revenue`.
- `docs/ieee830.md`: version 1.1 en control de cambios.
- `.env`: se eliminaron `SEED_ADMIN_PASSWORD` y `SEED_OPERADOR_PASSWORD`.
- `prisma/dbml/schema.dbml`: regenerado.

### Estado actual
- Pods `parqueadero-db` + `parqueadero-app` arriba en `https://localhost:3001`.
- Credenciales de la ultima BD recreada: admin `EKWE3T+UJ24eDaBC`, operador `xQ3GhgmMm5cbzPW` (cambian en cada seed).
- El MCP de Chromium de esta sesion quedo no disponible tras bloquearse con `window.print()`; requiere reiniciar opencode para E2E en vivo.

### Pendientes (siguiente fase)
- Fase 1: UML (casos de uso, clases, secuencias, componentes, despliegue, estados, ER) y mockups en draw.io.
- Fase 2: diccionario de datos/ER/mapeo Prisma.
- Fase 3: umbrales de cobertura, tests de integracion, E2E Playwright, matriz RF-test e informe.
- Fase 4: manual tecnico, manual de usuario, guia rapida, CHANGELOG.
- Fase 5: ajustes IEEE 830 (1.4, RF-SALIDA-003, matriz completa).

## Sesion: 5-6 octubre 2026 (cierre de los 6 entregables)

### Regla de entorno
- En este host NO se debe usar `node`; todo corre dentro de contenedores Podman
  (`node:22` para Vitest/tsc/eslint/Prisma y `mcr.microsoft.com/playwright` para E2E).

### Fase 1 - Diseno tecnico (completada)
- `docs/diseno/` con indice `README.md`.
- UML en `docs/diseno/uml/` (.drawio editable + .svg + .png): casos-de-uso, clases,
  secuencia-login, secuencia-entrada, secuencia-salida-pago, secuencia-sync,
  componentes, despliegue y estados-transaccion.
- Mockups en `docs/diseno/mockups/` (14 pantallas).
- Generados por scripts: `docs/diseno/tools/drawio_lib.py`, `generar-uml.py`,
  `generar-mockups.py` (SVG con ImageMagick a PNG: `magick -background white x.svg x.png`).

### Fase 2 - Datos (completada)
- `docs/diseno/datos/`: er-modelo (.drawio/.svg/.png), modelo-er.dbml,
  diccionario-datos.md (29 entidades), mapeo-er-prisma.md; generados por
  `docs/diseno/tools/generar-datos.py` desde el schema Prisma.

### Fase 3 - Testing (completada)
- `vitest.config.ts` con umbrales: 80% en transactions/payments/rates/auth/crypto/plate
  y 70% en date; global 20/40/25. La cobertura critica real supera el 80%.
- 154 tests unitarios en 15 archivos (auth, transactions x2, payments, rates x2,
  reports x2, legal, claims, spaces, profile, client, sync, utils).
- Integracion: `vitest.integration.config.ts`, `src/tests/integration/flujo-entrada-salida.test.ts`
  y `scripts/test-integration.sh` (PostgreSQL efimero en Podman). 3 tests en verde.
- E2E: `playwright.config.ts` + `e2e/specs/{operador,admin,cliente}.spec.ts` con
  `@playwright/test@1.55.0`; corren en la imagen oficial de Playwright. 4 tests en verde.
  Scripts `test:integration` y `test:e2e` en package.json.
- `docs/calidad/`: plan-de-pruebas.md, matriz-trazabilidad-rf-test.md, informe-resultados.md.
- Nota: el flujo E2E de salida usa tarifa 0 cuando la entrada es reciente; el spec
  llena el monto solo si el campo existe.

### Fase 4 - Manuales (completada)
- `docs/manuales/manual-tecnico.md`, `manual-usuario.md`, `guia-rapida.md` y `CHANGELOG.md`.
- README con enlaces a diseno, calidad, manuales y changelog.

### Fase 5 - IEEE 830 (completada)
- Seccion 1.4 "Vision general del documento".
- Nuevo RF-SALIDA-003 (desglose de tarifa y liberacion de espacio).
- Trazabilidad RF-prueba completa en 3.3; version 1.1 actualizada.

### Estado del entorno al cierre
- Pods `parqueadero-db` + `parqueadero-app` arriba en `https://localhost:3001`.
- Credenciales de la BD actual: admin `EKWE3T+UJ24eDaBC`, operador `Operador123!`
  (restablecida para E2E), cliente `cliente@ejemplo.com` / `Cliente123!`.
- `@playwright/test@1.55.0` agregado a devDependencies (instalado con pnpm en contenedor).
- El navegador MCP de Chromium volvio a estar disponible (se uso en sesiones previas).

### Pendientes funcionales (fuera del alcance de esta sesion)
- UI para crear reclamos y checklists, offline real con SQLite/SQLCipher, impresion
  termica/PDF, notificaciones por email, exportacion CSV/PDF y pagina de perfil en el SPA.

