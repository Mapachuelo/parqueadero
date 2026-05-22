# Arquitectura

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Runtime | Node.js | LTS |
| Package manager | pnpm | v11 (obligatorio) |
| Lenguaje | TypeScript | ultima estable |
| Frontend | React | 18+ |
| Backend | Node.js + Fastify | ultima estable |
| Base de datos primaria | PostgreSQL | 15+ |
| Base de datos local (offline) | SQLite | 3+ (SQLCipher para cifrado) |
| ORM | Prisma | ultima estable |
| Validacion | Zod | ultima estable |
| Hashing | bcrypt | salt rounds=12 |
| Cifrado | AES-256-GCM | placas vehiculares |
| Fechas | date-fns | locale es-CO |
| Contenedores | Podman + podman-compose | ultima estable |
| Testing | Vitest | ultima estable |

## Patron de arquitectura

**Modular monolith** con separacion de capas por modulo:

```
Modulo
├── <nombre>.router.ts       # Rutas Fastify (definicion de endpoints)
├── <nombre>.controller.ts   # Handlers HTTP (parsea request, llama service, responde)
├── <nombre>.service.ts      # Logica de negocio
├── <nombre>.repository.ts   # Acceso a datos via Prisma
├── <nombre>.schema.ts       # Validacion Zod (request/response)
├── <nombre>.test.ts         # Tests unitarios y de integracion
└── index.ts                 # Exporta el router del modulo
```

Cada modulo expone su router, que se registra en `server.ts`.

## Comandos

```bash
# Desarrollo
pnpm install          # Instalar dependencias
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Compilar TypeScript
pnpm start            # Iniciar en produccion

# Base de datos
pnpm db:generate      # Generar migraciones
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Poblar datos de prueba

# Contenedores (Podman)
podman-compose up -d  # Levantar PostgreSQL y servicios
podman-compose down   # Detener servicios

# Testing
pnpm test             # Unit tests
pnpm test:integration # Integration tests
pnpm test:e2e         # E2E tests (futuro)
pnpm test:coverage    # Cobertura de tests

# Calidad de codigo
pnpm lint             # ESLint
pnpm typecheck        # TypeScript type checking
pnpm format           # Prettier
```

## Estructura del proyecto

```
.
├── src/
│   ├── server.ts               # Entry point: crea instancia Fastify, registra plugins, inicia
│   ├── app.ts                  # Fabrica de la app Fastify (para testing sin iniciar servidor)
│   ├── config/
│   │   └── env.ts              # Carga y valida variables de entorno con Zod
│   ├── modules/
│   │   ├── auth/               # Modulo de autenticacion (RF-ACCESO-*)
│   │   ├── transactions/       # Modulo de transacciones (RF-RECEP-*, RF-SALIDA-*)
│   │   ├── payments/           # Modulo de pagos (RF-SALIDA-004)
│   │   ├── rates/              # Modulo de tarifas (RF-TARIFA-*)
│   │   ├── reports/            # Modulo de reporteria (RF-REPORT-*)
│   │   ├── legal/              # Modulo de compliance legal (RF-LEGAL-001, 002, 003)
│   │   ├── claims/             # Modulo de reclamos (RF-LEGAL-004)
│   │   ├── profile/            # Modulo de perfil de usuario (RF-PERFIL-*)
│   │   ├── client/             # Modulo de consulta de cliente (RF-CLIENTE-*)
│   │   ├── sync/               # Modulo de sincronizacion offline (RF-OFFLINE-*)
│   │   └── spaces/             # Modulo de espacios de parqueo (RF-ESPACIO-*)
│   ├── shared/
│   │   ├── errors/
│   │   │   └── app-error.ts    # Clase AppError con codigo HTTP y mensaje en espanol
│   │   ├── middleware/
│   │   │   ├── auth-guard.ts   # Verifica JWT, adjunta req.user
│   │   │   ├── role-guard.ts   # Factory: requireRole(['admin', 'operador'])
│   │   │   ├── audit-log.ts    # Hook onResponse para auditoria
│   │   │   ├── rate-limiter.ts # Configuracion por endpoint
│   │   │   ├── device-auth.ts  # API Key para endpoints de sync
│   │   │   └── error-handler.ts# SetErrorHandler: Zod + AppError -> JSON
│   │   ├── utils/
│   │   │   ├── crypto.ts       # encryptPlate, decryptPlate (AES-256-GCM)
│   │   │   ├── ids.ts          # generateTransactionId, generateClaimId, etc.
│   │   │   ├── date.ts         # roundDuration, formatDate (primeros 15 min gratis)
│   │   │   └── plate.ts        # isValidColombianPlate, isValidInternationalPlate
│   │   ├── i18n/
│   │   │   └── es-CO.json      # Mensajes de error y UI en espanol colombiano
│   │   └── types/
│   │       ├── fastify.d.ts     # Extiende Fastify Request con user
│   │       └── enums.ts        # Role, Category, BillingMode, PaymentMethod, etc.
│   ├── db/
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Schema Prisma (PostgreSQL)
│   │   └── seeds/              # Seeds por modulo
│   └── jobs/
│       ├── subscription-expiry.ts   # Notifica vencimientos de mensualidades
│       └── credit-low-balance.ts    # Notifica saldo bajo de abonos
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── data/                       # Base de datos SQLite local (gitignored)
├── docs/                       # Documentacion del proyecto
├── db/                         # Estrategias de sincronizacion y esquemas SQL de referencia
├── .agents/                    # Reglas y memoria del agente
├── docker-compose.yml          # Podman compose (PostgreSQL)
├── package.json
├── tsconfig.json
└── README.md
```

## API REST - Endpoints por modulo

### Auth
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/auth/login` | Publico |
| POST | `/api/auth/logout` | Autenticado |
| GET | `/api/auth/session` | Autenticado |
| POST | `/api/auth/register` | Admin |

### Transactions
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/transactions/entry` | Admin, Operador |
| GET | `/api/transactions/active` | Admin, Operador |
| GET | `/api/transactions/:id` | Admin, Operador |
| POST | `/api/transactions/:id/exit` | Admin, Operador |

### Payments
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/payments` | Admin, Operador |

### Rates
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/rates/structures` | Admin |
| GET | `/api/rates/structures` | Admin |
| PUT | `/api/rates/structures/:id` | Admin |
| POST | `/api/rates/structures/:id/activate` | Admin |
| GET | `/api/rates/active` | Admin, Operador |
| GET | `/api/rates/history` | Admin |
| POST | `/api/rates/fractions` | Admin |
| GET | `/api/rates/fractions` | Admin, Operador |
| POST | `/api/rates/subscriptions` | Admin |
| GET | `/api/rates/subscriptions` | Admin |
| PUT | `/api/rates/subscriptions/:id/renew` | Admin |
| POST | `/api/rates/credits` | Admin |
| GET | `/api/rates/credits` | Admin |
| POST | `/api/rates/credits/:id/recharge` | Admin, Operador |

### Legal
| Metodo | Ruta | Roles |
|--------|------|-------|
| GET | `/api/legal/custody-terms` | Admin |
| POST | `/api/legal/custody-terms` | Admin |
| PUT | `/api/legal/custody-terms/:id/activate` | Admin |
| GET | `/api/legal/checklist` | Admin |
| POST | `/api/legal/checklist` | Admin |
| PUT | `/api/legal/checklist/:id/items/:itemId` | Admin |
| POST | `/api/legal/checklist/:id/complete` | Admin |
| GET | `/api/legal/compliance-report` | Admin |

### Claims
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/claims` | Admin, Operador |
| GET | `/api/claims` | Admin |
| GET | `/api/claims/:id` | Admin |
| PUT | `/api/claims/:id` | Admin |
| POST | `/api/claims/:id/evidence` | Admin, Operador |
| POST | `/api/claims/:id/notes` | Admin |
| PUT | `/api/claims/:id/resolve` | Admin |

### Reports
| Metodo | Ruta | Roles |
|--------|------|-------|
| GET | `/api/reports/occupancy` | Admin |
| GET | `/api/reports/revenue` | Admin |
| GET | `/api/reports/transactions` | Admin |
| GET | `/api/reports/users` | Admin |
| GET | `/api/reports/compliance` | Admin |

### Profile
| Metodo | Ruta | Roles |
|--------|------|-------|
| GET | `/api/profile` | Autenticado |
| PUT | `/api/profile` | Autenticado |
| PUT | `/api/profile/password` | Autenticado |
| GET | `/api/profile/sessions` | Autenticado |
| DELETE | `/api/profile/sessions/:id` | Autenticado |
| DELETE | `/api/profile/sessions` | Autenticado |
| GET | `/api/profile/export` | Autenticado |

### Client
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/client/auth` | Publico |
| GET | `/api/client/transactions` | Cliente |
| GET | `/api/client/transactions/:id` | Cliente |
| GET | `/api/client/transactions/export` | Cliente |

### Sync
| Metodo | Ruta | Auth |
|--------|------|------|
| POST | `/api/sync` | API Key |
| GET | `/api/sync/status` | API Key |
| GET | `/api/sync/conflicts` | Admin |
| POST | `/api/sync/conflicts/:id/resolve` | Admin |
| GET | `/api/sync/rates` | API Key |
| GET | `/api/sync/users` | API Key |
| GET | `/api/sync/subscriptions` | API Key |
| GET | `/api/sync/credits` | API Key |

### Spaces
| Metodo | Ruta | Roles |
|--------|------|-------|
| GET | `/api/spaces` | Admin, Operador |
| GET | `/api/spaces/occupancy` | Admin, Operador |
| PUT | `/api/spaces/:code` | Admin |

## Manejo de errores

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// Ejemplos:
throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaccion no encontrada');
throw new AppError(409, 'PLATE_ALREADY_ACTIVE', 'El vehiculo ya se encuentra en el parqueadero');
throw new AppError(403, 'FORBIDDEN', 'No tiene permisos para realizar esta accion');
throw new AppError(400, 'VALIDATION_ERROR', 'Datos de entrada invalidos');
```

Errores de validacion Zod se transforman automaticamente a 400 con detalles en español.

## Sincronizacion offline (RF-OFFLINE-*)

Estrategia documentada en `db/sync_strategy.md`. Arquitectura:

```
Dispositivo POS (SQLite + SQLCipher)
       |
       | POST /api/sync  (HTTPS + API Key)
       v
Servidor (PostgreSQL)
       |
       | Verifica conflictos:
       | - Mismo transaction_id -> server wins
       | - Mismo plate_hash + entry_time (±5 min) -> manual
       | - Guarda en sync_conflicts si hay conflicto
       v
Responde { synced, conflicts, conflict_ids }
```

Endpoint principal: `POST /api/sync` recibe batch de registros pendientes (`sync_status = 'pending'`) y los inserta en PostgreSQL resolviendo conflictos automaticamente cuando es posible. Los conflictos que requieren intervencion manual se notifican al Admin via `GET /api/sync/conflicts`.

## Convenciones de codigo

- TypeScript estricto (`strict: true` en tsconfig.json)
- ESLint con configuracion Airbnb o similar
- Nombres de archivos en kebab-case (ej. `rate-calculator.ts`)
- Clases/interfaces en PascalCase, funciones/variables en camelCase
- Cada modulo tiene su propio index.ts que exporta el router
- Comentarios JSDoc en funciones publicas y logica compleja
- Sin `any` - usar tipos explicitos o `unknown` con type guards
- Mensajes de error y UI en archivo `src/shared/i18n/es-CO.json`, en español colombiano
- Fechas en formato colombiano (DD de MMM de YYYY), moneda en COP ($X.XXX,XX), zona horaria UTC-5

## Variables de entorno requeridas

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

## Seguridad (segun IEEE 830 RNF-SEG-*)

- Contraseñas: hash bcrypt con salt rounds=12 (nunca texto plano)
- Placas vehiculares: cifrado AES-256-GCM en reposo + hash SHA-256 para busquedas sin descifrar
- Comunicacion: HTTPS con TLS 1.3 minimo
- Sesiones: JWT con expiracion de 30 minutos (admin/operador), 20 minutos (cliente)
- Roles: RBAC - Admin, Operador, Cliente (verificar en cada request via middleware)
- Rate limiting:
  - POST /api/auth/login: 5 por minuto
  - GET /api/client/*: 10 por minuto
  - POST /api/sync: sin limite (interno, autenticado por API Key)
- Logs de auditoria inmutables: quien, que, cuando, resultado (tabla audit_logs sin UPDATE ni DELETE)
- Bloqueo tras 3 intentos fallidos de login (30 minutos)
- Helmet para headers HTTP de seguridad
- CORS restringido al origen del frontend

## Testing (segun IEEE 830 RNF-MANT-002)

- Unit tests: cobertura minima 80% en codigo critico (tarifas, seguridad)
- Integration tests: flujos completos entrada -> salida -> pago
- Cada requisito funcional (RF) debe tener al menos 1 test
- Framework: Vitest para unit/integration, Playwright para E2E (futuro)
- Test database: SQLite en memoria para unit tests, PostgreSQL en Podman para integration

## Git workflow (segun IEEE 830 RNF-MANT-003)

- `main`: produccion estable
- `develop`: desarrollo activo
- `feature/<nombre>`: nuevas funcionalidades
- `hotfix/<nombre>`: correcciones urgentes
- Semantic Versioning: MAJOR.MINOR.PATCH
- Commits en español, descriptivos, en presente

## Metodologia de desarrollo (segun IEEE 830 2.4.4)

- Scrum con sprints de 1-2 semanas
- Planning -> Desarrollo -> Review -> Retrospectiva
- MVP en 8-12 semanas con funcionalidades basicas de entrada, salida y tarifa

## Sprints planificados

| Sprint | Modulos | RF cubiertos |
|--------|---------|-------------|
| Sprint 1 | Inicializacion + DB + auth | RF-ACCESO-001, 002, 003 |
| Sprint 2 | transactions (entrada + salida) | RF-RECEP-*, RF-SALIDA-* |
| Sprint 3 | payments + rates | RF-TARIFA-001 a 004 |
| Sprint 4 | legal + claims | RF-LEGAL-001 a 004 |
| Sprint 5 | reports + spaces | RF-REPORT-*, RF-ESPACIO-001 |
| Sprint 6 | profile + client | RF-PERFIL-*, RF-CLIENTE-001 |
| Sprint 7 | sync + tests + cobertura | RF-OFFLINE-*, RNF-MANT-002 |
