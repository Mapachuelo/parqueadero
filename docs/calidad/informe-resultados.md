# Informe de resultados de pruebas

Fecha de ejecucion: 5-6 de octubre de 2026.
Entorno: Podman rootless en Linux; Node 22 y PostgreSQL 16 en contenedores;
Chromium (Playwright 1.55) para E2E.

## 1. Pruebas unitarias

Comando:

```bash
podman run --rm --security-opt label=disable -v "$PWD:/app" -w /app \
  docker.io/library/node:22 node_modules/.bin/vitest run --coverage
```

Resultado:

- **15 archivos de prueba, 154 tests, 0 fallos.**
- Modulos cubiertos: auth, transactions, payments, rates, reports, legal,
  claims, spaces, profile, client, sync y utilidades compartidas.
- Los tests estan colocalizados junto al codigo y cada uno referencia el RF
  que valida (p.ej. `RF-RECEP-001`).

## 2. Cobertura

Umbrales configurados en `vitest.config.ts` (RNF-MANT-002: 80% en codigo critico).

| Archivo | Sentencias | Ramas | Funciones | Umbral |
|---------|-----------:|------:|----------:|--------|
| `transactions.service.ts` | 93.2% | 73.2% | 100% | 80% |
| `payments.service.ts` | 82.7% | 70.0% | 87.5% | 80% |
| `rates.service.ts` | 98.8% | 87.2% | 100% | 80% |
| `auth.service.ts` | 95.6% | 95.2% | 85.7% | 80% |
| `shared/utils/crypto.ts` | 95.3% | 77.8% | 87.5% | 80% |
| `shared/utils/plate.ts` | 100% | 100% | 100% | 80% |
| `shared/utils/date.ts` | 100% | 100% | 100% | 70% |
| **Total (todo `src/`)** | **34.4%** | **74.0%** | **48.3%** | - |

Nota: el total incluye archivos de "pegamento" sin tests (repositorios, routers,
controladores, servicios de mail/PDF y `app.ts`), lo que diluye el porcentaje
global. Todos los modulos criticos superan el 80% exigido y los umbrales hacen
fallar la build si bajan.

## 3. Pruebas de integracion

Comando: `pnpm test:integration` (o `bash scripts/test-integration.sh`).
Levanta un PostgreSQL 16 efimero en Podman, aplica `prisma migrate deploy`,
ejecuta el seed y corre los tests.

Resultado: **1 archivo, 3 tests, 0 fallos.**

- Flujo completo entrada -> salida -> pago (espacio ocupado/liberado, ticket,
  pago en efectivo con cambio, estado `completed`).
- Rechazo de placa duplicada activa.
- Verificacion de cifrado de placa (no legible en claro) y hash de 64 caracteres.

## 4. Pruebas E2E (Chromium)

Comando (imagen oficial de Playwright, sin Node en el host):

```bash
podman run --rm --security-opt label=disable --network host -v "$PWD:/app" -w /app \
  -e E2E_BASE_URL=https://localhost:3001 \
  -e E2E_ADMIN_PASSWORD -e E2E_OPERATOR_PASSWORD -e E2E_CLIENT_EMAIL -e E2E_CLIENT_PASSWORD \
  mcr.microsoft.com/playwright:v1.55.0-noble npx playwright test
```

Resultado: **4 tests, 0 fallos.**

| Espec | Caso | RF |
|-------|------|----|
| `operador.spec.ts` | Login, entrada con ticket, activos, salida con pago y recibo | RF-RECEP-001/004, RF-SALIDA-001/004/005 |
| `admin.spec.ts` | Dashboard, tarifas (4 pestanas), reportes (5 pestanas), reclamos, legal, espacios, usuarios | RF-TARIFA-*, RF-REPORT-*, RF-LEGAL-002, RF-ESPACIO-001 |
| `cliente.spec.ts` | Acceso por cuenta en el portal y redireccion del login principal | RF-CLIENTE-001 |

Evidencia historica de ejecuciones manuales con Chromium en `e2e/*.png`
(login, ticket corregido, activos, pago, recibo, panel admin, portal cliente).

## 5. Calidad de codigo

| Verificacion | Comando | Resultado |
|--------------|---------|-----------|
| Tipos | `tsc --noEmit` (raiz y `client/`) | Sin errores |
| Lint | `eslint src/` | 0 errores (25 warnings preexistentes) |
| Migraciones | `prisma migrate deploy` | 1 migracion aplicada |

## 6. Incidencias corregidas durante las pruebas

Las campanas E2E detectaron y corrigieron 7 defectos funcionales (ver
`.agents/notes/memory.md`): ticket de entrada sin datos, detalle de salida por id
numerico, salida sin registrar `exit_time`, recibo con forma de respuesta
incorrecta, lista de usuarios admin vacia, portal cliente sin historial y
duracion/`tickets` mal leidos en el portal.

## 7. Conclusiones

- El software cumple los RF del MVP con pruebas automatizadas en los tres
  niveles (unitario, integracion y E2E) y cobertura >= 80% en los modulos
  criticos.
- Brechas declaradas y no bloqueantes: OCR, API externa y 2FA (futuros del SRS),
  cliente offline real con SQLite/SQLCipher, notificaciones por email y UI de
  creacion de reclamos/checklists y pagina de perfil.
