# Prompt: Arquitectura backend desde cero

## Contexto

Construir el backend desde cero para el Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia, siguiendo el SRS en `docs/ieee830.md` y las skills en `.agents/skills/architecture.md` y `.agents/skills/skill.md`.

---

## Stack tecnologico obligatorio

| Capa | Tecnologia |
|------|-----------|
| Runtime | Node.js LTS |
| Package manager | pnpm v11 |
| Lenguaje | TypeScript ultima estable (`strict: true`) |
| Framework backend | Fastify (schema validation nativa, performance) |
| Validacion | Zod (schemas compartibles) |
| ORM | Prisma (PostgreSQL + SQLite) |
| Base de datos central | PostgreSQL 15+ |
| Base de datos local offline | SQLite 3+ (SQLCipher para cifrado) |
| Contenedores | Podman + podman-compose |
| Hashing | bcrypt (salt rounds=12) |
| Cifrado | AES-256-GCM para placas |
| Fechas | date-fns con locale es-CO |
| Testing | Vitest (unit + integration) |
| Linting | ESLint + Prettier |

---

## Variables de entorno requeridas (.env)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/parqueadero
SQLITE_PATH=./data/local.db
JWT_SECRET=<random-256-bit>
JWT_EXPIRATION_MINUTES=30
PLATE_ENCRYPTION_KEY=<random-256-bit-hex>
SYNC_API_KEY=<random-api-key-for-devices>
PORT=3000
NODE_ENV=development
```

---

## Fase 0: Inicializacion del proyecto

### Paso 0.1: Crear proyecto

```bash
pnpm init
pnpm add fastify @fastify/jwt @fastify/cors @fastify/rate-limit @fastify/helmet @fastify/multipart
pnpm add prisma @prisma/client
pnpm add bcrypt zod date-fns dotenv
pnpm add -D typescript tsx @types/node @types/bcrypt
pnpm add -D vitest @vitest/coverage-v8
pnpm add -D eslint prettier eslint-config-prettier
pnpm add -D prisma-dbml-generator
```

### Paso 0.2: Configurar TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Paso 0.3: Crear docker-compose.yml con PostgreSQL

```yaml
version: "3.8"
services:
  postgres:
    image: docker.io/library/postgres:16
    environment:
      POSTGRES_USER: parqueadero
      POSTGRES_PASSWORD: parqueadero
      POSTGRES_DB: parqueadero
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

### Paso 0.4: Configurar scripts en package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx src/db/seeds/index.ts",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write src/"
  }
}
```

---

## Fase 1: Estructura del proyecto

Crear la siguiente estructura de carpetas y archivos:

```
src/
├── server.ts                       # Entry point: crea instancia Fastify, registra plugins, inicia
├── app.ts                          # Fabrica de la app Fastify (para testing)
├── config/
│   └── env.ts                      # Carga y valida variables de entorno con Zod
├── db/
│   ├── prisma/
│   │   └── schema.prisma           # Schema Prisma unico con generator para PostgreSQL
│   └── seeds/
│       ├── index.ts                # Orquestador de seeds
│       ├── users.seed.ts           # Admin por defecto, operador demo
│       ├── rates.seed.ts           # Tarifas base para categorias A, B, C, D
│       └── spaces.seed.ts          # 100 espacios de parqueo
├── shared/
│   ├── errors/
│   │   └── app-error.ts            # Clase AppError con codigo HTTP, mensaje en espanol
│   ├── middleware/
│   │   ├── auth-guard.ts           # Verifica JWT, adjunta req.user
│   │   ├── role-guard.ts           # Factory: requireRole(['admin', 'operador'])
│   │   ├── audit-log.ts            # Hook onResponse para registrar accion en audit_logs
│   │   ├── rate-limiter.ts         # Configuracion por endpoint
│   │   ├── device-auth.ts          # API Key para endpoints de sync
│   │   └── error-handler.ts        # SetErrorHandler de Fastify: Zod + AppError -> JSON
│   ├── utils/
│   │   ├── crypto.ts               # encryptPlate, decryptPlate (AES-256-GCM)
│   │   ├── ids.ts                  # generateTransactionId, generateClaimId, etc.
│   │   ├── date.ts                 # formatDate, roundDuration (primeros 15 min gratis, resto redondea arriba)
│   │   └── plate.ts                # isValidColombianPlate, isValidInternationalPlate
│   ├── i18n/
│   │   └── es-CO.json              # Mensajes de error y UI en espanol colombiano
│   └── types/
│       ├── express.d.ts            # Extiende Fastify Request con user
│       └── enums.ts                # Role, Category, BillingMode, PaymentMethod, ClaimStatus, etc.
├── modules/
│   ├── auth/
│   │   ├── auth.router.ts          # POST /api/auth/login, logout, register, GET /session
│   │   ├── auth.controller.ts      # Handlers que parsean request y llaman service
│   │   ├── auth.service.ts         # login, logout, validateSession, register
│   │   ├── auth.repository.ts      # Acceso a tabla users y user_sessions via Prisma
│   │   ├── auth.schema.ts          # Zod: loginSchema, registerSchema
│   │   ├── auth.test.ts            # Unit + integration tests
│   │   └── index.ts                # Exporta router
│   ├── transactions/
│   │   ├── transactions.router.ts  # POST /entry, GET /:id, GET /active, POST /:id/exit
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts # registerEntry, registerExit, calculateRate, applyBillingMode
│   │   ├── transactions.repository.ts
│   │   ├── transactions.schema.ts  # entrySchema, exitSchema, plateSchema
│   │   ├── transactions.test.ts
│   │   └── index.ts
│   ├── payments/
│   │   ├── payments.router.ts      # POST /api/payments
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts     # processPayment, calculateChange, generateReceipt
│   │   ├── payments.repository.ts
│   │   ├── payments.schema.ts      # paymentSchema
│   │   ├── payments.test.ts
│   │   └── index.ts
│   ├── rates/
│   │   ├── rates.router.ts         # CRUD tarifas, fracciones, suscripciones, abonos
│   │   ├── rates.controller.ts
│   │   ├── rates.service.ts        # createRate, activateRate, validateNoOverlap, getActiveRate
│   │   ├── rates.repository.ts
│   │   ├── rates.schema.ts         # rateSchema, fractionRateSchema, subscriptionSchema, creditSchema
│   │   ├── rates.test.ts
│   │   └── index.ts
│   ├── legal/
│   │   ├── legal.router.ts         # CRUD custody-terms, checklist, compliance-report
│   │   ├── legal.controller.ts
│   │   ├── legal.service.ts
│   │   ├── legal.repository.ts
│   │   ├── legal.schema.ts
│   │   ├── legal.test.ts
│   │   └── index.ts
│   ├── claims/
│   │   ├── claims.router.ts        # CRUD reclamos, evidencia, notas
│   │   ├── claims.controller.ts
│   │   ├── claims.service.ts       # registerClaim, assignInvestigator, resolveClaim
│   │   ├── claims.repository.ts
│   │   ├── claims.schema.ts
│   │   ├── claims.test.ts
│   │   └── index.ts
│   ├── reports/
│   │   ├── reports.router.ts       # GET occupancy, revenue, transactions, users, compliance
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts      # buildOccupancyReport, buildRevenueReport, buildAuditReport
│   │   ├── reports.repository.ts   # Consultas agregadas y vistas materializadas
│   │   ├── reports.schema.ts       # dateRangeSchema, reportFiltersSchema
│   │   ├── reports.test.ts
│   │   └── index.ts
│   ├── spaces/
│   │   ├── spaces.router.ts        # GET /api/spaces, GET /api/spaces/occupancy
│   │   ├── spaces.controller.ts
│   │   ├── spaces.service.ts       # assignSpace, releaseSpace, checkOccupancyAlerts
│   │   ├── spaces.repository.ts
│   │   ├── spaces.schema.ts
│   │   ├── spaces.test.ts
│   │   └── index.ts
│   ├── profile/
│   │   ├── profile.router.ts       # GET/PUT profile, PUT password, GET/DELETE sessions
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts      # updateProfile, changePassword, manageSessions
│   │   ├── profile.repository.ts
│   │   ├── profile.schema.ts       # profileSchema, passwordChangeSchema
│   │   ├── profile.test.ts
│   │   └── index.ts
│   ├── client/
│   │   ├── client.router.ts        # GET /api/client/transactions (historial propio)
│   │   ├── client.controller.ts
│   │   ├── client.service.ts       # getClientHistory, filterByDate, exportToPdfCsv
│   │   ├── client.repository.ts
│   │   ├── client.schema.ts        # clientQuerySchema, accessCodeSchema
│   │   ├── client.test.ts
│   │   └── index.ts
│   └── sync/
│       ├── sync.router.ts          # POST /sync, GET /status, GET /conflicts, POST /conflicts/:id/resolve
│       ├── sync.controller.ts
│       ├── sync.service.ts         # receiveBatch, detectConflicts, resolveConflict
│       ├── sync.repository.ts
│       ├── sync.schema.ts          # syncPayloadSchema
│       ├── sync.test.ts
│       └── index.ts
└── tests/
    ├── unit/
    └── integration/
```

---

## Fase 2: Esquema de base de datos (Prisma)

Traducir los esquemas SQL de `db/postgresql_schema.sql` y `db/sqlite_schema.sql` a `schema.prisma` con un unico generador `prisma-client-js`. Las tablas son:

### Tablas del dominio

| Tabla | Proposito | RF asociado |
|-------|-----------|-------------|
| `users` | Usuarios del sistema: admin, operador, cliente | RF-ACCESO-001, 003 |
| `user_sessions` | Sesiones activas JWT | RF-ACCESO-002, RF-PERFIL-004 |
| `user_notification_preferences` | Preferencias de notificacion por usuario | RF-PERFIL-002 |
| `rate_structures` | Agrupacion de tarifas con vigencia | RF-TARIFA-001 |
| `rates` | Tarifas por hora por categoria | RF-TARIFA-001, 002 |
| `rate_change_history` | Historico de cambios tarifarios | RF-TARIFA-001, 003 |
| `rate_change_notifications` | Notificaciones de cambio tarifario | RF-TARIFA-003 |
| `fraction_rates` | Tarifas por fraccion (15/30/45 min) | RF-TARIFA-004 |
| `monthly_subscriptions` | Suscripciones mensuales por placa | RF-TARIFA-004 |
| `subscription_notifications` | Notificaciones de vencimiento | RF-TARIFA-004 |
| `prepaid_credits` | Abonos/creditos prepagados | RF-TARIFA-004 |
| `prepaid_movements` | Historial de movimientos de abonos | RF-TARIFA-004 |
| `credit_notifications` | Notificaciones de saldo bajo | RF-TARIFA-004 |
| `vehicle_transactions` | Transacciones de entrada/salida | RF-RECEP-*, RF-SALIDA-* |
| `payments` | Pagos procesados | RF-SALIDA-004 |
| `custody_terms` | Versiones de terminos de custodia | RF-LEGAL-001 |
| `tickets` | Tiquetes y recibos emitidos | RF-RECEP-004, RF-SALIDA-005 |
| `parking_spaces` | Espacios de parqueo | RF-ESPACIO-001 |
| `claims` | Reclamos de clientes | RF-LEGAL-004 |
| `claim_evidence` | Evidencia adjunta a reclamos | RF-LEGAL-004 |
| `claim_notes` | Notas de investigacion | RF-LEGAL-004 |
| `audit_logs` | Log inmutable de auditoria | RNF-SEG-003 |
| `legal_checklists` | Checklists de pre-operacion | RF-LEGAL-002 |
| `legal_checklist_items` | Items del checklist | RF-LEGAL-002 |
| `system_config` | Configuracion del sistema | General |
| `sync_log` | Log de sincronizaciones | RF-OFFLINE-001 |
| `sync_conflicts` | Conflictos de sincronizacion | RF-OFFLINE-002 |

### Campos sensibles y cifrado

- `plate_encrypted`: Almacenar como `Bytes` en PostgreSQL (pgcrypto), como `String` (base64 del ciphertext) en SQLite
- `plate_hash`: SHA-256 del texto de placa en minusculas, para busquedas sin descifrar
- `password_hash`: bcrypt hash

### Relaciones clave

```
users 1──N user_sessions
users 1──N vehicle_transactions (operator_id, entry_operator_id, exit_operator_id)
users 1──N payments
users 1──N audit_logs
users 1──N claims (reported_by, assigned_to)
users 1──N legal_checklists
users 1──N monthly_subscriptions (registered_by)
users 1──N prepaid_credits (purchased_by)
users 1──1 user_notification_preferences

rate_structures 1──N rates
rate_structures 1──N fraction_rates

vehicle_transactions 1──1 payments
vehicle_transactions 1──N tickets
vehicle_transactions 1──N claims

prepaid_credits 1──N prepaid_movements

legal_checklists 1──N legal_checklist_items
claims 1──N claim_evidence
claims 1──N claim_notes
```

### Vistas materializadas para reportes

Crear modelos Prisma para las vistas materializadas `mv_daily_occupancy` y `mv_daily_revenue` definidas en `db/postgresql_schema.sql` (lineas 462-495).

---

## Fase 3: Implementacion de modulos por orden

### Sprint 1: Init + DB + auth (RF-ACCESO-001, 002, 003)

#### 3.1.1 Esquema Prisma
Generar migracion inicial con todas las tablas.

#### 3.1.2 Seed
Crear admin por defecto (admin@parqueadero.com / Admin123!), operador demo, tarifas base ($5000 A, $8000 B, $12000 C, $3000 D), 100 espacios de parqueo, terminos de custodia v1.0, checklist legal vacio, configuracion del sistema.

#### 3.1.3 Modulo auth

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| POST | `/api/auth/login` | Login con email/username + password. Devuelve JWT. Bloquea tras 3 fallos/30 min | Publico |
| POST | `/api/auth/logout` | Invalida sesion activa | Autenticado |
| GET | `/api/auth/session` | Verifica token y devuelve datos del usuario | Autenticado |
| POST | `/api/auth/register` | Admin crea nuevo usuario (operador o admin) | Admin |

**Logica:**
- `login`: buscar usuario por email o username, comparar bcrypt, generar JWT con `{ sub: user.id, role: user.role }`, guardar sesion en `user_sessions`, registrar en `audit_logs`
- Bloqueo: `failed_login_attempts >= 3` -> `locked_until = NOW() + 30 min`. No revelar si fallo es por usuario inexistente o password incorrecto
- `must_change_password`: si es true, devolver flag en sesion para forzar cambio
- JWT expiracion: 30 minutos configurable via `JWT_EXPIRATION_MINUTES`

**Middleware:**
- `authGuard`: extrae token del header `Authorization: Bearer <token>`, verifica firma, busca sesion activa en `user_sessions`, adjunta `req.user = { id, role, username }`. Si token expirado o sesion inactiva: 401
- `roleGuard(roles: Role[])`: factory que retorna middleware verificando `req.user.role` este en la lista. Si no: 403

#### 3.1.4 Tests
- Login exitoso con credenciales validas
- Login fallido con password incorrecta
- Bloqueo tras 3 intentos fallidos
- Acceso denegado sin token
- Acceso denegado con rol incorrecto
- Registro de usuario por admin

---

### Sprint 2: transactions - entrada (RF-RECEP-001 a 005)

#### 3.2.1 Modulo transactions (entrada)

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| POST | `/api/transactions/entry` | Registrar entrada de vehiculo | Admin, Operador |
| GET | `/api/transactions/active` | Listar vehiculos actualmente en parqueadero | Admin, Operador |
| GET | `/api/transactions/:id` | Buscar transaccion por placa o TXN-ID | Admin, Operador |

**Logica POST /entry:**
1. Validar body con `entrySchema` (Zod):
   - `plate`: string, formato colombiano `AAA-123` o `ABC123`, o internacional alfanumerico
   - `category`: enum A | B | C | D
   - `customerName`: string max 100 chars
   - `customerPhone`: string opcional
   - `isInternationalPlate`: boolean opcional
   - `countryOrigin`: string opcional (si internacional)
   - `vehicleDescription`: string opcional (si internacional)
2. Validar placa no duplicada activa en parqueadero (`status = 'active'`)
3. Cifrar placa con `encryptPlate(plate)` -> `plate_encrypted`
4. Calcular `plate_hash = sha256(plate.toLowerCase())`
5. Generar `transaction_id` = `TXN-YYYYMMDD-NNNNN`
6. Obtener `entry_time = new Date()`
7. Si `parking_capacity > 0`, asignar primer espacio disponible
8. Verificar si placa tiene mensualidad activa (`monthly_subscriptions` status='activa' AND today entre start_date y end_date) -> `billing_mode = 'mensualidad'`
9. Insertar en `vehicle_transactions` con `status = 'active'`
10. Emitir tiquete: insertar en `tickets` con `ticket_type = 'entrada'`, `custody_terms_version` activa
11. Registrar en `audit_logs`
12. Retornar `{ transaction_id, entry_time, space_assigned, ticket }`

**Validacion de placa (RF-RECEP-002):**
```typescript
function isValidColombianPlate(plate: string): boolean {
  return /^[A-Z]{3}-?\d{3}$/i.test(plate);
}

function isValidInternationalPlate(plate: string): boolean {
  return /^[A-Z0-9\s-]{3,15}$/i.test(plate);
}
```

**Generacion de TXN-ID (RF-RECEP-001):**
```typescript
function generateTransactionId(): string {
  const datePart = format(new Date(), 'yyyyMMdd');
  const maxSeq = await getMaxSequenceForDate(datePart);
  return `TXN-${datePart}-${String(maxSeq + 1).padStart(5, '0')}`;
}
```

**Tiquete de entrada (RF-RECEP-004):**
- Incluir: fecha/hora entrada, placa, ID transaccion, categoria, nombre operador, terminos de custodia, contacto parqueadero
- `custody_terms_version` = version activa en tabla `custody_terms`

**Placas internacionales (RF-RECEP-005):**
- Si `isInternationalPlate = true`, aceptar formato alfanumerico variado (3-15 chars)
- Requerir `vehicleDescription` y `countryOrigin`
- Asignar categoria segun descripcion (A, B, C)

#### 3.2.2 Tests
- Entrada con placa colombiana valida
- Entrada con placa duplicada activa -> error
- Entrada con placa internacional
- Entrada con placa invalida -> error Zod
- Asignacion de espacio automatica
- Tiquete generado con terminos de custodia

---

### Sprint 3: transactions - salida + payments + rates (RF-SALIDA-001 a 005, RF-TARIFA-001 a 004)

#### 3.3.1 Modulo transactions (salida)

**Endpoints adicionales:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| POST | `/api/transactions/:id/exit` | Calcular tarifa y preparar cobro | Admin, Operador |
| POST | `/api/payments` | Procesar pago y cerrar transaccion | Admin, Operador |

**Logica POST /:id/exit:**
1. Buscar transaccion por `transaction_id` o `plate` (activa)
2. Si no existe o ya tiene `exit_time`: error 404/409
3. Obtener `exit_time = new Date()`
4. Calcular `duration_minutes = (exit_time - entry_time) / 60000`
5. Aplicar politica de redondeo (RF-SALIDA-002):
   - Si `duration_minutes <= free_minutes` (15): `rounded_hours = 0`, tarifa $0
   - Sino: `rounded_hours = Math.ceil(duration_minutes / 60)`
6. Determinar `billing_mode` y calcular tarifa (RF-TARIFA-004):
   - **Prioridad 1:** Mensualidad activa para la placa -> `final_amount = 0`, `billing_mode = 'mensualidad'`
   - **Prioridad 2:** Abono con saldo -> `billing_mode = 'abono'`, descontar del abono. Si saldo insuficiente -> `billing_mode = 'mixto'`, diferencia a pagar en efectivo/tarjeta
   - **Prioridad 3:** Tarifa por fraccion (si habilitada y duracion <= 45 min) -> `billing_mode = 'fraccion'`
   - **Prioridad 4:** Tarifa por hora -> `billing_mode = 'hora'`, `total_amount = rate.price_per_hour * rounded_hours`
7. Retornar resumen de cobro:
```json
{
  "transaction_id": "TXN-20260505-00001",
  "plate": "AAA-123",
  "category": "A",
  "entry_time": "2026-05-05T10:15:00-05:00",
  "exit_time": "2026-05-05T13:00:00-05:00",
  "duration_minutes": 165,
  "rounded_hours": 3,
  "billing_mode": "hora",
  "rate_per_hour": 5000,
  "total_amount": 15000,
  "discount_amount": 0,
  "final_amount": 15000
}
```

**Logica POST /payments:**
1. Validar `transaction_id` existe y esta activa
2. Validar `payment_method`: efectivo, tarjeta_credito, tarjeta_debito, transferencia, billetera_digital, abono
3. Si efectivo: validar `amount_paid >= final_amount`, calcular `change_amount = amount_paid - final_amount`
4. Si abono: validar saldo suficiente, descontar, registrar movimiento en `prepaid_movements`
5. Si mixto (abono insuficiente): descontar abono + diferencia en efectivo/tarjeta
6. Insertar en `payments`
7. Actualizar `vehicle_transactions`: `exit_time`, `status = 'completed'`
8. Liberar espacio de parqueo si asignado
9. Generar recibo de salida: insertar en `tickets` con `ticket_type = 'salida'`
10. Registrar en `audit_logs`
11. Retornar `{ receipt, change_amount }`

#### 3.3.2 Modulo rates

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| POST | `/api/rates/structures` | Crear estructura tarifaria | Admin |
| GET | `/api/rates/structures` | Listar estructuras tarifarias | Admin |
| PUT | `/api/rates/structures/:id` | Modificar estructura | Admin |
| POST | `/api/rates/structures/:id/activate` | Activar estructura (con fecha efectiva) | Admin |
| GET | `/api/rates/active` | Obtener tarifas vigentes | Admin, Operador |
| GET | `/api/rates/history` | Historico de cambios | Admin |
| POST | `/api/rates/fractions` | Crear/editar tarifa por fraccion | Admin |
| GET | `/api/rates/fractions` | Listar tarifas por fraccion | Admin, Operador |
| POST | `/api/rates/subscriptions` | Registrar mensualidad | Admin |
| GET | `/api/rates/subscriptions` | Listar mensualidades | Admin |
| PUT | `/api/rates/subscriptions/:id/renew` | Renovar mensualidad | Admin |
| POST | `/api/rates/credits` | Vender abono prepagado | Admin |
| GET | `/api/rates/credits` | Listar abonos | Admin |
| POST | `/api/rates/credits/:id/recharge` | Recargar abono | Admin, Operador |

**Logica clave:**
- **Validacion de no solapamiento:** Al crear/activar rate, verificar que no exista otra tarifa activa para la misma categoria en el mismo periodo
- **Notificaciones de cambio:** Al programar cambio tarifario futuro, crear registros en `rate_change_notifications` para admin (5 dias antes) y operadores (1 dia antes)
- **Notificaciones de vencimiento:** Job diario que revisa `monthly_subscriptions` proximas a vencer (5 dias) y genera `subscription_notifications`
- **Notificaciones de saldo bajo:** Verificar `prepaid_credits` con saldo < 20% y generar `credit_notifications`
- **IDs unicos:** `SUB-YYYYMM-NNNNN` para suscripciones, `CRD-YYYYMMDD-NNNNN` para abonos

---

### Sprint 4: legal + claims (RF-LEGAL-001 a 004)

#### 3.4.1 Modulo legal

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/legal/custody-terms` | Listar versiones de terminos | Admin |
| POST | `/api/legal/custody-terms` | Crear nueva version | Admin |
| PUT | `/api/legal/custody-terms/:id/activate` | Activar version | Admin |
| GET | `/api/legal/checklist` | Obtener checklist actual | Admin |
| POST | `/api/legal/checklist` | Crear/iniciar checklist | Admin |
| PUT | `/api/legal/checklist/:id/items/:itemId` | Marcar/desmarcar item | Admin |
| POST | `/api/legal/checklist/:id/complete` | Completar checklist y generar certificado | Admin |
| GET | `/api/legal/compliance-report` | Reporte de cumplimiento | Admin |

**Logica:**
- **Bloqueo de operacion:** Middleware `checkLegalCompliance` que verifica si existe un `legal_checklist` con `is_complete = true`. Sino, toda operacion de entrada/salida retorna 403 con mensaje "Complete el checklist legal de pre-operacion antes de iniciar operaciones"
- **Terminos de custodia:** Cada tiquete referencia la version activa. El reporte de cumplimiento muestra % de tiquetes con terminos
- **Proteccion de datos:** En reportes de ingresos por vehiculo, enmascarar placa parcialmente: `AAA-***`

#### 3.4.2 Modulo claims

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| POST | `/api/claims` | Registrar reclamo | Admin, Operador |
| GET | `/api/claims` | Listar reclamos con filtros | Admin |
| GET | `/api/claims/:id` | Ver detalle de reclamo | Admin |
| PUT | `/api/claims/:id` | Actualizar estado, asignar, anadir notas | Admin |
| POST | `/api/claims/:id/evidence` | Adjuntar evidencia | Admin, Operador |
| POST | `/api/claims/:id/notes` | Agregar nota de investigacion | Admin |
| PUT | `/api/claims/:id/resolve` | Resolver reclamo | Admin |

**Logica:**
- Generar `claim_id = CLM-YYYYMMDD-NNNNN`
- `resolution_deadline = created_at + 30 days`
- Estados: `abierto` -> `en_investigacion` -> `resuelto` / `rechazado`
- Si `resolution_deadline` expira sin resolucion -> `status = 'vencido'`
- Notificar a admin cuando se crea un reclamo nuevo

---

### Sprint 5: reports + spaces (RF-REPORT-001 a 005, RF-ESPACIO-001)

#### 3.5.1 Modulo reports

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/reports/occupancy` | Ocupacion actual e historica | Admin |
| GET | `/api/reports/revenue` | Ingresos por periodo | Admin |
| GET | `/api/reports/transactions` | Auditoria de transacciones | Admin |
| GET | `/api/reports/users` | Actividad de operadores | Admin |
| GET | `/api/reports/compliance` | Cumplimiento legal | Admin |

**Query params comunes:**
- `from`, `to`: rango de fechas (ISO 8601)
- `category`: filtrar por categoria (A, B, C, D)
- `paymentMethod`: filtrar por metodo de pago
- `operatorId`: filtrar por operador
- `format`: `json` | `csv` | `pdf` | `xlsx`

**Reportes:**

1. **Ocupacion** (RF-REPORT-001):
   - Espacios totales, ocupados, libres, % ocupacion
   - Historico por hora (usar `mv_daily_occupancy` o query agregada)
   - Hora pico, hora valle
   - Duracion promedio de parqueo

2. **Ingresos** (RF-REPORT-002):
   - Total COP en periodo
   - Desglose por categoria (transacciones, ingresos, promedio)
   - Desglose por metodo de pago
   - Descuentos otorgados
   - Comparacion con periodo anterior (variacion %)

3. **Transacciones** (RF-REPORT-003):
   - Listado completo con filtros: fecha, operador, metodo pago, categoria, placa, monto
   - Operador solo ve sus propias transacciones
   - Paginado, ordenable

4. **Actividad de usuarios** (RF-REPORT-004):
   - Por operador: transacciones procesadas, ingresos gestionados, descuentos, errores, horas trabajadas
   - Ranking de productividad

5. **Cumplimiento legal** (RF-REPORT-005):
   - % tiquetes emitidos vs transacciones
   - % tiquetes con terminos de custodia
   - Accesos a datos de clientes
   - Reclamos: abiertos, resueltos en plazo, vencidos

#### 3.5.2 Modulo spaces

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/spaces` | Matriz de ocupacion | Admin, Operador |
| GET | `/api/spaces/occupancy` | Resumen ocupacion (total, ocupados, libres, %) | Admin, Operador |
| PUT | `/api/spaces/:code` | Liberar espacio manualmente | Admin |

**Alertas de ocupacion:**
- 90%: warning
- 95%: alerta (notificar admin + operadores)
- 99%: critico
- 100%: lleno, rechazar nuevas entradas

---

### Sprint 6: profile + client (RF-PERFIL-001 a 007, RF-CLIENTE-001)

#### 3.6.1 Modulo profile

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| GET | `/api/profile` | Obtener perfil y preferencias | Autenticado |
| PUT | `/api/profile` | Actualizar preferencias | Autenticado |
| PUT | `/api/profile/password` | Cambiar contraseña | Autenticado |
| GET | `/api/profile/sessions` | Listar sesiones activas | Autenticado |
| DELETE | `/api/profile/sessions/:id` | Cerrar sesion remota | Autenticado |
| DELETE | `/api/profile/sessions` | Cerrar todas las demas sesiones | Autenticado |
| GET | `/api/profile/export` | Exportar datos personales (JSON) | Autenticado |

**Logica cambio de contraseña (RF-PERFIL-003):**
1. Validar `currentPassword` contra hash almacenado
2. Validar `newPassword`: min 8 chars, mayuscula, minuscula, numero, simbolo
3. Validar que no sea igual a 5 contraseñas anteriores (mantener historico en `password_history` o usar campo en users)
4. Cerrar todas las sesiones activas excepto la actual
5. Actualizar hash, `must_change_password = false`
6. Enviar email de confirmacion
7. Registrar en `audit_logs`

**Preferencias de notificacion (RF-PERFIL-002):**
- Lectura/escritura en `user_notification_preferences`
- Los toggles de notificaciones criticas de seguridad no se pueden desactivar
- Cambios se guardan inmediatamente

#### 3.6.2 Modulo client

**Endpoints:**

| Metodo | Ruta | Descripcion | Roles |
|--------|------|-------------|-------|
| POST | `/api/client/auth` | Autenticacion de cliente (email+password o codigo acceso) | Publico |
| GET | `/api/client/transactions` | Historial de parqueos del cliente | Cliente |
| GET | `/api/client/transactions/:id` | Detalle de transaccion | Cliente |
| GET | `/api/client/transactions/export` | Exportar historial (PDF/CSV) | Cliente |

**Autenticacion de cliente (RF-CLIENTE-001):**
- Opcion A: `email` + `password` -> JWT con role='cliente', expiry 20 min
- Opcion B: `transactionId` + `plateLast4` -> token temporal de acceso a ESA transaccion (sin crear cuenta)
- Rate limiting: 10 consultas/minuto
- El cliente SOLO ve sus propias transacciones (filtrado por `customer_email` o `plate_hash`)
- Datos visibles: ID transaccion, placa, categoria, entrada, salida, duracion, tarifa, descuentos, metodo pago, estado

---

### Sprint 7: sync offline + tests + cobertura (RF-OFFLINE-001, 002)

#### 3.7.1 Modulo sync

**Endpoints:**

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/api/sync` | Recibir batch de transacciones offline | API Key |
| GET | `/api/sync/status` | Estado de ultima sincronizacion | API Key |
| GET | `/api/sync/conflicts` | Listar conflictos pendientes | Admin |
| POST | `/api/sync/conflicts/:id/resolve` | Resolver conflicto manual | Admin |
| GET | `/api/sync/rates` | Descargar tarifas actualizadas | API Key |
| GET | `/api/sync/users` | Descargar usuarios | API Key |
| GET | `/api/sync/subscriptions` | Descargar mensualidades activas | API Key |
| GET | `/api/sync/credits` | Descargar abonos activos | API Key |

**Logica POST /sync:**
1. Autenticar dispositivo via `SYNC_API_KEY`
2. Recibir payload con `device_id`, `last_sync_timestamp`, arrays de `transactions`, `payments`, etc.
3. Para cada registro:
   - Verificar si `transaction_id` ya existe en servidor -> conflicto tipo `duplicate`
   - Verificar si `plate_hash + entry_time` (±5 min) ya existe con status 'active' -> conflicto tipo `data_conflict`
   - Si no hay conflicto: insertar en PostgreSQL
   - Si hay conflicto: guardar en `sync_conflicts` con datos de ambas versiones
4. Actualizar `sync_log` con resultado
5. Retornar `{ synced: N, conflicts: M, conflict_ids: [...] }`

**Resolucion de conflictos (RF-OFFLINE-002):**

| Tipo de conflicto | Regla | Accion |
|-------------------|-------|--------|
| Mismo `transaction_id` | Server wins | Descarta registro offline |
| Mismos `plate_hash + entry_time` (±5 min) ambos active | Manual | Admin decide cual preservar |
| Mismo plate_hash pero uno tiene exit_time | Server wins | El que tiene salida es valido |
| Datos diferentes para mismo server_id | Manual | Admin decide |

---

## Fase 4: Middleware transversal

### authGuard

```typescript
// Verifica JWT en header Authorization: Bearer <token>
// Busca sesion activa en user_sessions
// Adjunta req.user = { id, role, username }
// Si invalido: 401 { error: "Sesion invalida o expirada" }
```

### roleGuard

```typescript
// Factory: roleGuard(['admin', 'operador'])
// Verifica req.user.role esta en la lista
// Si no: 403 { error: "No tiene permisos para realizar esta accion" }
```

### deviceAuth

```typescript
// Para endpoints /api/sync/*
// Verifica header X-API-Key contra SYNC_API_KEY
```

### auditLog

```typescript
// Hook onResponse de Fastify
// Registra en audit_logs: user_id, action (ruta), entity_type, entity_id, ip, user_agent
// Logs inmutables: tabla sin UPDATE ni DELETE, solo INSERT y SELECT
```

### errorHandler

```typescript
// setErrorHandler de Fastify
// ZodError -> 400 con detalles de validacion en espanol
// AppError -> statusCode y mensaje
// Error generico -> 500 { error: "Error interno del servidor" }
```

### rateLimiter

```typescript
// Configurar por endpoint:
// POST /api/auth/login: 5 por minuto
// GET /api/client/*: 10 por minuto
// POST /api/sync: sin limite (interno)
```

---

## Fase 5: Seguridad (RNF-SEG-*)

### Implementar

1. **bcrypt** salt rounds = 12 para todas las contraseñas
2. **AES-256-GCM** para cifrar/descifrar placas:
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function encryptPlate(plaintext: string, key: Buffer): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted, iv, tag };
}

function decryptPlate(encrypted: Buffer, key: Buffer, iv: Buffer, tag: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```
3. **plate_hash** = `sha256(plate.toLowerCase())` para busquedas sin descifrar
4. **JWT** firmado con `JWT_SECRET`, expiration 30 min
5. **Helmet** configurado en Fastify
6. **CORS** restringido al origen del frontend
7. **Rate limiting** en endpoints publicos
8. **Audit logs inmutables** (solo INSERT)

---

## Fase 6: Tests

### Unit tests (Vitest)

Por cada modulo, probar:
- **auth**: login exitoso, fallido, bloqueo, RBAC
- **transactions**: calculo de tarifa, redondeo, prioridad de modalidades, validacion de placa
- **rates**: no solapamiento, vigencia, notificaciones
- **legal**: checklist, terminos de custodia
- **sync**: deteccion de conflictos

### Integration tests

Flujos completos:
1. Login -> entrada -> salida -> pago en efectivo
2. Entrada -> salida con mensualidad activa (tarifa $0)
3. Entrada -> salida con abono (descuento de saldo)
4. Entrada -> salida con pago mixto (abono insuficiente + efectivo)
5. Operacion offline -> sync -> resolucion de conflicto

### Cobertura

- Codigo critico (tarifas, seguridad): 80%
- Cada RF debe tener al menos 1 test

---

## Fase 7: Documentacion adicional

- `README.md` actualizado con instrucciones de instalacion, ejecucion, test
- `.agents/notes/memory.md` actualizado al final de cada sprint
- Esquema de endpoints documentado en `docs/api.md`

---

## Orden de implementacion

| Sprint | Modulos | RF cubiertos | Semanas |
|--------|---------|-------------|---------|
| Sprint 1 | Inicializacion + DB + auth | RF-ACCESO-001, 002, 003 | 1-2 |
| Sprint 2 | transactions (entrada + salida) | RF-RECEP-*, RF-SALIDA-* | 3-4 |
| Sprint 3 | payments + rates | RF-TARIFA-001 a 004 | 5-6 |
| Sprint 4 | legal + claims | RF-LEGAL-001 a 004 | 7-8 |
| Sprint 5 | reports + spaces | RF-REPORT-*, RF-ESPACIO-001 | 9-10 |
| Sprint 6 | profile + client | RF-PERFIL-*, RF-CLIENTE-001 | 11 |
| Sprint 7 | sync + tests + cobertura | RF-OFFLINE-*, RNF-MANT-002 | 12 |

---

## Comandos de desarrollo

```bash
pnpm dev              # Servidor de desarrollo
pnpm build            # Compilar TypeScript
pnpm lint             # ESLint
pnpm typecheck        # Type checking
pnpm test             # Unit tests
pnpm test:coverage    # Cobertura de tests

# Base de datos
podman-compose up -d  # Levantar PostgreSQL
pnpm db:generate      # Generar migraciones
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Datos de prueba

# Git
git checkout -b feature/<nombre>  # Nueva rama
git add <archivos>
git commit -m "<mensaje>"
```

## Test 

Hacer un test de funcionamiento de la web mediante `podman-compose up --build -d`
