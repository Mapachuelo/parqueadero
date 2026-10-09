# Arquitectura

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Runtime | Node.js | 22 (Alpine en contenedores) |
| Package manager | pnpm | v11 (obligatorio) |
| Lenguaje | TypeScript | 5.7 (strict) |
| Frontend | React + Vite | React 19, Vite 6, TanStack Router 1, Tailwind 4, React Query 5, react-hook-form 7 + Zod 4 |
| Backend | Fastify | 5 |
| Base de datos primaria | PostgreSQL | 16 |
| Base de datos local (offline) | SQLite | 3+ (SQLCipher pendiente) |
| ORM | Prisma | 6 |
| Validacion | Zod | 4 |
| Integracion Zod-Fastify | @fastify/type-provider-zod | 1 |
| Hashing | bcryptjs | salt rounds=12 |
| Cifrado | AES-256-GCM | placas vehiculares |
| Fechas | date-fns | 4, locale es-CO |
| Email | nodemailer | 8 |
| PDF | pdfkit | 0.18 (servicio implementado, aun sin endpoints) |
| CSV | papaparse | 5 |
| Jobs programados | node-cron | 4 |
| Documentacion API | @fastify/swagger + @fastify/swagger-ui | 9 / 5 |
| Health checks | @fastify/under-pressure | 9 |
| Upload archivos | @fastify/multipart | 9 |
| Contenedores | Podman (pods nativos YAML con `kube play`) | ultima estable |
| Testing | Vitest | 3 (unitarios colocalizados) |

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

Cada modulo expone su router, que se registra en `app.ts` (fabrica `buildApp()`). `server.ts` es solo el entrypoint que arranca el servidor.

## Plugins Fastify

Registrados en `app.ts` en este orden:

| Plugin | Proposito |
|--------|-----------|
| `@fastify/helmet` | Headers HTTP de seguridad |
| `@fastify/cors` | CORS (hoy `origin: true`; pendiente restringir al frontend) |
| `@fastify/rate-limit` | Rate limiting por endpoint |
| `@fastify/jwt` | Autenticacion JWT |
| `@fastify/multipart` | Upload de archivos (evidencia reclamos) |
| `@fastify/swagger` | Generacion automatica de documentacion OpenAPI |
| `@fastify/swagger-ui` | UI interactiva para explorar la API |
| `@fastify/under-pressure` | Health checks y monitoreo de memoria/event loop |
| `@fastify/type-provider-zod` | Integracion Zod-Fastify para schemas compartidos |

Nota: `@fastify/compress` figuraba en la documentacion pero NO esta registrado en `app.ts`.

## Comandos

```bash
# Desarrollo
pnpm install          # Instalar dependencias (.npmrc tiene ignore-scripts=true)
pnpm dev              # Backend con tsx watch en :3000
pnpm dev:client       # Frontend Vite en :5173 (proxy /api -> :3000)
pnpm build            # Compilar backend (tsc a dist/)
pnpm build:client     # Compilar frontend
pnpm start            # Iniciar backend compilado

# Base de datos (migraciones y seeds son manuales)
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # tsx src/db/seeds/index.ts (imprime credenciales aleatorias una vez)
pnpm db:studio        # prisma studio

# Contenedores (Podman pods, archivos en la raiz)
podman build -t localhost/parqueadero-backend:latest -f Containerfile.backend .
podman build -t localhost/parqueadero-frontend:latest -f Containerfile.frontend .
podman kube play --replace --network parqueadero-net db-pod.yaml    # PostgreSQL
podman kube play --replace --network parqueadero-net app-pod.yaml   # backend + nginx
podman kube down app-pod.yaml db-pod.yaml

# Testing
pnpm test             # Unit tests colocalizados (vitest run): 154 tests
pnpm test:watch       # Unit tests en modo watch
pnpm test:coverage    # Cobertura con umbrales (vitest.config.ts)
pnpm test:integration # PostgreSQL efimero en Podman (scripts/test-integration.sh)
pnpm test:e2e         # Playwright contra https://localhost:3001 (requiere pods y credenciales)

# Calidad de codigo
pnpm lint             # ESLint raiz (src/)
pnpm typecheck        # tsc --noEmit
pnpm format           # Prettier sobre src/
pnpm --filter @parqueadero/client typecheck   # tsc del cliente
pnpm --filter @parqueadero/client lint        # ESLint del cliente
```

Nota del host: en este equipo `pnpm` no esta en el PATH de shells no interactivos; usar
`node_modules/.bin/<tool>` (tsc, eslint, vitest, prisma) o `pnpm --filter` desde una terminal con pnpm.

## Entorno local de pruebas (pods Podman)

- Red interna: `parqueadero-net`. Web en `https://localhost:3001` (nginx sirve TLS y proxya `/api` al backend).
- TLS local: certificado autofirmado en `./ssl` (CN=localhost) montado por `app-pod.yaml` (ruta de trabajo, gitignored). Requiere `chcon -R -t container_file_t ssl` por SELinux y estar importado en `~/.pki/nssdb` con `certutil` para que Chromium lo confie.
- El MCP de Playwright necesita `--ignore-https-errors` (ya agregado en `~/.config/opencode/opencode.json`).
- Reset desde 0: `podman kube down app-pod.yaml db-pod.yaml`, `podman volume rm -f parqueadero-pgdata`, replay `db-pod.yaml`, migrar+seed con contenedor one-off (`node_modules/.bin/prisma migrate deploy && node dist/db/seeds/index.js`) y replay `app-pod.yaml`.
- Credenciales: el seed imprime claves aleatorias de `admin` y `operador` una sola vez; no hay credenciales fijas ni en `.env`.

## Estructura del proyecto

```
.
├── src/
│   ├── server.ts               # Entry point: arranca la app compilada (dist/server.js)
│   ├── app.ts                  # Fabrica buildApp(): registra plugins, routers, swagger, health
│   ├── config/
│   │   └── env.ts              # Carga y valida variables de entorno con Zod
│   ├── modules/                # Modular monolith; tests unitarios colocalizados (*.test.ts)
│   │   ├── auth/               # Autenticacion, sesiones, usuarios (RF-ACCESO-*)
│   │   ├── transactions/       # Entrada/salida de vehiculos (RF-RECEP-*, RF-SALIDA-*)
│   │   ├── payments/           # Pagos (RF-SALIDA-004)
│   │   ├── rates/              # Tarifas, fracciones, mensualidades, abonos (RF-TARIFA-*)
│   │   ├── reports/            # Reporteria (RF-REPORT-*)
│   │   ├── legal/              # Compliance legal (RF-LEGAL-001, 002, 003)
│   │   ├── claims/             # Reclamos (RF-LEGAL-004)
│   │   ├── profile/            # Perfil de usuario (RF-PERFIL-*)
│   │   ├── client/             # Portal/consulta de cliente (RF-CLIENTE-*)
│   │   ├── sync/               # Sincronizacion offline (RF-OFFLINE-*)
│   │   └── spaces/             # Espacios de parqueo (RF-ESPACIO-*)
│   ├── shared/
│   │   ├── errors/
│   │   │   └── app-error.ts    # Clase AppError con codigo HTTP y mensaje en espanol
│   │   ├── middleware/
│   │   │   ├── auth-guard.ts   # Verifica JWT + sesion activa, adjunta req.user
│   │   │   ├── role-guard.ts   # Factory: roleGuard(['admin', 'operador'])
│   │   │   ├── audit-log.ts    # Hook onResponse para auditoria
│   │   │   ├── rate-limiter.ts # Configuracion por endpoint
│   │   │   ├── device-auth.ts  # API Key para endpoints de sync
│   │   │   └── error-handler.ts# SetErrorHandler: Zod + AppError -> JSON
│   │   ├── services/
│   │   │   ├── mail.service.ts # sendMail (nodemailer)
│   │   │   └── pdf.service.ts  # generateTicketPdf, generateReportPdf, generateReceiptPdf (pdfkit)
│   │   ├── utils/
│   │   │   ├── crypto.ts       # encryptPlateToBuffer, decryptPlateFromBuffer, hashPlate (AES-256-GCM + SHA-256)
│   │   │   ├── ids.ts          # generateTransactionId, generateTicketNumber, generateClaimId
│   │   │   ├── date.ts         # calculateDurationMinutes, roundDuration, formatDate
│   │   │   ├── plate.ts        # isValidPlate (colombiana e internacional)
│   │   │   └── csv.ts          # parseCsv/generateCsv (papaparse)
│   │   ├── i18n/
│   │   │   └── es-CO.json      # Mensajes de error y UI en espanol colombiano
│   │   └── types/
│   │       ├── fastify.d.ts    # Extiende Fastify Request con user
│   │       └── enums.ts        # Role, Category, BillingMode, PaymentMethod, etc.
│   ├── db/
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Schema Prisma real (PostgreSQL)
│   │   └── seeds/              # Seeds por modulo (usuarios, tarifas, espacios, legal, config)
│   └── jobs/
│       ├── scheduler.ts             # Inicializa node-cron con todos los jobs programados
│       ├── subscription-expiry.ts   # Notifica vencimientos de mensualidades
│       ├── credit-low-balance.ts    # Notifica saldo bajo de abonos
│       ├── backup-daily.ts          # Backup automatico diario de BD
│       └── auto-report.ts           # Genera reporte diario de ingresos
├── client/                     # SPA React 19 (Vite, TanStack Router, Tailwind 4)
│   └── src/
│       ├── routes/             # Rutas por rol (_admin.*, _operator.*, _cliente.*)
│       ├── components/         # EntradaForm, SalidaForm, ActivosList
│       └── lib/                # api.ts (ky), auth.tsx, query.ts, utils.ts
├── prisma/
│   ├── schema.prisma -> ../src/db/prisma/schema.prisma   # symlink
│   ├── migrations/             # 20260522181540_init (unica migracion)
│   └── dbml/schema.dbml        # Generado por prisma-dbml-generator
├── db/                         # Estrategia de sync y esquemas SQL de referencia
├── docs/                       # SRS IEEE 830, prompts, drawio
├── e2e/                        # Evidencia de pruebas manuales (capturas PNG)
├── .agents/                    # Reglas, skills y memoria del agente
├── Containerfile.backend       # Imagen Podman (Fastify API)
├── Containerfile.frontend      # Imagen Podman (nginx + React)
├── nginx.conf                  # Config nginx (SPA + proxy /api + TLS)
├── db-pod.yaml / app-pod.yaml  # Pods declarativos de trabajo (gitignored)
├── example.db-pod.yaml / example.app-pod.yaml  # Plantillas versionadas
├── package.json
├── tsconfig.json
└── README.md
```

Nota: los tests NO viven en un directorio `tests/` raiz; estan colocalizados junto al codigo
(`src/modules/**/*.test.ts`). `src/tests/{unit,integration}` existe pero esta vacio.

## API REST - Endpoints por modulo

### Auth
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/auth/login` | Publico |
| POST | `/api/auth/logout` | Autenticado |
| GET | `/api/auth/session` | Autenticado |
| POST | `/api/auth/register` | Admin (roles: admin, operador, cliente) |
| GET | `/api/auth/users` | Admin (listado de usuarios) |

### Transactions
| Metodo | Ruta | Roles |
|--------|------|-------|
| POST | `/api/transactions/entry` | Admin, Operador (acepta `customerEmail` opcional para el portal cliente) |
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
| POST | `/api/client/auth` | Publico (email+password o transactionId+plateLast4) |
| GET | `/api/client/transactions` | Cliente |
| GET | `/api/client/transactions/:id` | Cliente |

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

### Health
| Metodo | Ruta | Roles |
|--------|------|-------|
| GET | `/health` | Publico |
| GET | `/health/ready` | Publico (readiness probe para Podman/containers) |

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

## Api documentation

Swagger auto-generado desde schemas Zod via `@fastify/type-provider-zod` + `@fastify/swagger`.

- Swagger UI disponible en: `http://localhost:3000/docs`
- JSON schema en: `http://localhost:3000/docs/json`
- Cada endpoint registra su schema Zod que se traduce automaticamente a OpenAPI 3.x
- Los schemas de request/response se definen una sola vez en `<modulo>.schema.ts` y se reutilizan para validacion y documentacion

## File uploads (evidencia de reclamos)

- Usar `@fastify/multipart` para recibir archivos adjuntos en POST `/api/claims/:id/evidence`
- Limite: 5 MB por archivo, maximo 5 archivos por reclamo
- Formatos permitidos: JPG, PNG, PDF
- Almacenamiento local en `./uploads/claims/<claim_id>/` en desarrollo
- En produccion: objeto storage (S3, MinIO, o filesystem con volumen persistente)
- Ruta de uploads configurable via variable de entorno `UPLOAD_DIR`

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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=parqueadero@email.com
SMTP_PASS=<app-password>
SMTP_FROM="Parqueadero Neiva <parqueadero@email.com>"
UPLOAD_DIR=./uploads
BACKUP_DIR=./backups
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
- CORS: hoy `origin: true` en `app.ts`; pendiente restringirlo al origen del frontend
- Roles reales: admin, operador y cliente (el registro permite crear los tres; el portal cliente usa `customer_email`)

## Testing (segun IEEE 830 RNF-MANT-002)

Estado actual (octubre 2026):

- Unit tests colocalizados en `src/modules/**/*.test.ts` y `src/shared/**/*.test.ts`: 15 archivos, 154 tests.
- Integracion: `src/tests/integration/` con `vitest.integration.config.ts` y PostgreSQL efimero (`scripts/test-integration.sh`).
- E2E: `e2e/specs/` con Playwright 1.55 (operador, admin, cliente); requiere credenciales del seed.
- Cobertura con umbrales en `vitest.config.ts`: 80% en modulos criticos (transacciones, pagos, tarifas, autenticacion y utils de seguridad).
- Resultados y matriz RF-prueba en `docs/calidad/`.

Objetivo (segun SRS):

- Unit tests: cobertura minima 80% en codigo critico (tarifas, seguridad, transacciones).
- Integration tests: flujos completos entrada -> salida -> pago contra PostgreSQL del pod.
- E2E: Playwright con `ignoreHTTPSErrors` sobre `https://localhost:3001` (operador, admin, cliente).
- Cada requisito funcional (RF) debe tener al menos 1 test y su fila en la matriz de trazabilidad.

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

## Estado del MVP (27 sep 2026)

- Implementado y verificado end-to-end: login (admin/operador/cliente), entrada con ticket, activos, salida con cálculo de tarifa y pago, portal cliente (por email y por transaccion+ultimos 4), dashboard, tarifas, reportes, reclamos (via API + UI de gestion), legal, espacios, usuarios (listar/crear).
- Pendientes funcionales: UI para crear reclamos y checklists legales, offline real en cliente (SQLite/SQLCipher), impresion termica/PDF de tiquetes, notificaciones por email (SMTP vacio), exportacion CSV/PDF de reportes, pagina de perfil en el SPA, 2FA/OCR (futuro segun SRS).
- Documentacion de diseno y calidad completada: `docs/diseno/` (UML, mockups, ER/diccionario) y `docs/calidad/` (plan, matriz RF-prueba, informe); manuales en `docs/manuales/`.
