# Plan de pruebas

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia.

Objetivo: demostrar que el software cumple los requerimientos del SRS
(`docs/ieee830.md`) y el diseno (`docs/diseno/`). Referencia: RNF-MANT-002.

## Niveles de prueba

| Nivel | Herramienta | Ubicacion | Que cubre |
|-------|-------------|-----------|-----------|
| Unitario | Vitest 3 | `src/**/*.test.ts` (colocalizados) | Servicios, utilidades, esquemas y reglas de negocio |
| Integracion | Vitest + PostgreSQL 16 | `src/tests/integration/**` | Flujos reales contra base de datos |
| E2E | Playwright (Chromium) | `e2e/specs/**` | Flujo completo en el despliegue de Podman |

Todo se ejecuta dentro de contenedores (no se requiere Node en el host).

## Como ejecutar

```bash
# Unitarias + cobertura (contenedor node:22)
podman run --rm --security-opt label=disable -v "$PWD:/app" -w /app \
  docker.io/library/node:22 node_modules/.bin/vitest run --coverage

# Integracion (levanta un PostgreSQL efimero en Podman)
pnpm test:integration        # o: bash scripts/test-integration.sh

# E2E contra el despliegue (requiere pods arriba y credenciales del seed)
E2E_ADMIN_PASSWORD=... E2E_OPERATOR_PASSWORD=... \
E2E_CLIENT_EMAIL=... E2E_CLIENT_PASSWORD=... \
podman run --rm --security-opt label=disable --network host -v "$PWD:/app" -w /app \
  -e E2E_BASE_URL=https://localhost:3001 \
  -e E2E_ADMIN_PASSWORD -e E2E_OPERATOR_PASSWORD -e E2E_CLIENT_EMAIL -e E2E_CLIENT_PASSWORD \
  mcr.microsoft.com/playwright:v1.55.0-noble npx playwright test
```

## Entornos

- Unitarias/integracion: `NODE_ENV=test` inyecta variables dummy (`src/config/env.ts`).
- Integracion: PostgreSQL 16 efimero (`parqueadero-test-db`) + migraciones + seed.
- E2E: pods `parqueadero-db` + `parqueadero-app` en `https://localhost:3001`.

## Criterios de aceptacion

1. `vitest run` sin fallos.
2. Cobertura >= 80% de sentencias/funciones en modulos criticos
   (transacciones, pagos, tarifas, autenticacion y utilidades de seguridad).
3. Tests de integracion en verde contra PostgreSQL real.
4. E2E en verde para operador, admin y cliente.
5. Cada requisito funcional (RF) con al menos un caso de prueba
   (ver `matriz-trazabilidad-rf-test.md`).

## Datos de prueba

- El seed crea usuarios `admin`/`operador` con claves aleatorias y tarifas/espacios.
- Las pruebas E2E generan placas aleatorias con formato colombiano (`ETA###`).
- Las pruebas de integracion usan placas `ITA###`/`ITB777` y manipulan la hora de
  entrada para validar el calculo tarifario.

## Exclusiones conocidas

- OCR/camara (RF-RECEP-003), API REST externa (RF-INTEG-001) y 2FA son futuros
  segun el SRS y no se prueban.
- Notificaciones por email requieren SMTP real y no se ejecutan en CI local.
- `Descargar Recibo` usa `window.print()` (dialogo nativo) y no es automatizable
  de forma fiable; se verifica la generacion del contenido y el endpoint de pago.
