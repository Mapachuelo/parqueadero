# Arquitectura

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Runtime | Node.js | LTS |
| Package manager | pnpm | v11 (obligatorio) |
| Lenguaje | TypeScript | ultima estable |
| Frontend | React | 18+ |
| Backend | Node.js + Express/Fastify | ultima estable |
| Base de datos primaria | PostgreSQL | 15+ |
| Base de datos local (offline) | SQLite | 3+ |
| ORM | Drizzle o Prisma | ultima estable |
| Contenedores | Podman + podman-compose | ultima estable |
| Testing | Vitest o Jest | ultima estable |

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
│   ├── modules/
│   │   ├── auth/           # Modulo de autenticacion (RF-ACCESO-*)
│   │   ├── transactions/   # Modulo de transacciones (RF-RECEP-*, RF-SALIDA-*)
│   │   ├── rates/          # Modulo de tarifas (RF-TARIFA-*)
│   │   ├── reports/        # Modulo de reporteria (RF-REPORT-*)
│   │   ├── legal/          # Modulo de compliance legal (RF-LEGAL-*)
│   │   ├── profile/        # Modulo de perfil de usuario (RF-PERFIL-*)
│   │   └── sync/           # Modulo de sincronizacion offline (RF-OFFLINE-*)
│   ├── shared/             # Utilidades compartidas
│   ├── db/                 # Esquemas, migraciones, seeds
│   └── server.ts           # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                   # Documentacion
├── db/                     # Estrategias de sincronizacion y BD
├── .agents/                # Reglas y memoria del agente
├── docker-compose.yml      # Podman compose
├── package.json
├── tsconfig.json
└── README.md
```

## Convenciones de codigo

- TypeScript estricto (`strict: true` en tsconfig.json)
- ESLint con configuracion Airbnb o similar
- Nombres de archivos en kebab-case (ej. `rate-calculator.ts`)
- Clases/interfaces en PascalCase, funciones/variables en camelCase
- Cada modulo tiene su propio index.ts que exporta la API publica
- Comentarios JSDoc en funciones publicas y logica compleja
- Sin `any` - usar tipos explicitos o `unknown` con type guards
- Strings de UI en archivo de recursos separado (i18n preparado)

## Seguridad (segun IEEE 830 RNF-SEG-*)

- Contraseñas: hash bcrypt con salt (nunca texto plano)
- Placas vehiculares: cifrado AES-256 en reposo
- Comunicacion: HTTPS con TLS 1.3 minimo
- Sesiones: JWT con expiracion de 30 minutos
- Roles: RBAC - Admin, Operador, Cliente (verificar en cada request)
- Rate limiting: max 10 consultas/minuto por cliente
- Logs de auditoria inmutables: quien, que, cuando, resultado
- Bloqueo tras 3 intentos fallidos de login (30 minutos)

## Testing (segun IEEE 830 RNF-MANT-002)

- Unit tests: cobertura minima 80% en codigo critico (tarifas, seguridad)
- Integration tests: flujos completos entrada -> salida -> pago
- Cada requisito funcional (RF) debe tener al menos 1 test
- Framework: Vitest para unit/integration, Playwright para E2E (futuro)
- Test database: SQLite en memoria para unit tests

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
