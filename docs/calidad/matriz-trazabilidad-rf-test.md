# Matriz de trazabilidad RF ↔ prueba

Cada requerimiento funcional del SRS (`docs/ieee830.md`) con su caso de prueba.
Estados: **Cubierto** (test automatizado), **Parcial** (cubierto a nivel de API/servicio
pero sin UI o al reves), **Futuro** (fuera del alcance del MVP).

## Acceso y autenticacion

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-ACCESO-001 | Autenticacion de usuarios | `auth.test.ts`: login ok, credenciales invalidas, bloqueo a 3 intentos | Unitario | Cubierto |
| RF-ACCESO-002 | Gestion de sesion (30 min, aviso 5 min) | `auth.test.ts`: validateSession; `client/src/lib/auth.tsx` (temporizadores) | Unitario | Parcial (UI sin test) |
| RF-ACCESO-003 | Roles y permisos | `auth.test.ts`: register admin/operador/cliente y 403; E2E admin/operador/cliente | Unitario + E2E | Cubierto |

## Recepcion de vehiculos

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-RECEP-001 | Registro de entrada + ticket + espacio | `transactions.test.ts` (registerEntry), `flujo-entrada-salida.test.ts`, E2E operador | Unit + Integ + E2E | Cubierto |
| RF-RECEP-002 | Validacion de placa y duplicados | `transactions.test.ts` (placa invalida/duplicada), `flujo-entrada-salida.test.ts` | Unit + Integ | Cubierto |
| RF-RECEP-003 | Lectura OCR de placa | - | - | Futuro |
| RF-RECEP-004 | Ticket de entrada con terminos | `transactions.test.ts` (custody_terms_version), `flujo-entrada-salida.test.ts` (tickets) | Unit + Integ | Cubierto |
| RF-RECEP-005 | Placas internacionales | `transactions.test.ts` (is_international, country_origin) | Unitario | Cubierto |

## Salida y tarificacion

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-SALIDA-001 | Registro de salida por placa/ID | `transactions.test.ts` (por transaction_id y por placa), E2E operador | Unit + E2E | Cubierto |
| RF-SALIDA-002 | Calculo de tarifa por duracion | `transactions.test.ts` (primeros 15 min, redondeo), `utils.test.ts` (roundDuration), `flujo-entrada-salida.test.ts` (2h = $10.000) | Unit + Integ | Cubierto |
| RF-SALIDA-003 | Desglose de tarifa y liberacion de espacio | `transactions.test.ts`, `flujo-entrada-salida.test.ts` (espacio libre al salir) | Unit + Integ | Cubierto |
| RF-SALIDA-004 | Procesamiento de pago | `payments.test.ts` (efectivo/cambio, tarjeta, abono, mixto, errores), `flujo-entrada-salida.test.ts` | Unit + Integ | Cubierto |
| RF-SALIDA-005 | Recibo de salida | `payments.test.ts` (ticket salida + terminos), E2E operador (recibo) | Unit + E2E | Cubierto |

## Gestion de tarifas

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-TARIFA-001 | Configuracion de tarifas por categoria | `rates.test.ts` + `rates.extra.test.ts` (estructuras, tarifas, historial) | Unitario | Cubierto |
| RF-TARIFA-002 | Vigencia temporal de tarifas | `rates.extra.test.ts` (activateStructure, updateStructure), `transactions.test.ts` (findActiveRate) | Unitario | Cubierto |
| RF-TARIFA-003 | Notificaciones de cambio tarifario | Jobs `rate-change` (no automatizado) | - | Futuro |
| RF-TARIFA-004 | Hora, fraccion, mensualidad y abono | `rates.extra.test.ts` (subscriptions/credits), `payments.test.ts` (abono/mixto), `transactions.test.ts` (mensualidad) | Unitario | Cubierto |

## Compliance legal

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-LEGAL-001 | Terminos de custodia en el ticket | `legal.test.ts`, `payments.test.ts` (custody_terms_version) | Unitario | Cubierto |
| RF-LEGAL-002 | Checklist legal de pre-operacion | `legal.test.ts` (crear/marcar/completar/compliance) | Unitario | Parcial (creacion de checklist solo por API) |
| RF-LEGAL-003 | Proteccion de datos (placa cifrada) | `utils.test.ts` (crypto), `flujo-entrada-salida.test.ts` (cifrado + hash) | Unit + Integ | Cubierto |
| RF-LEGAL-004 | Reclamos | `claims.test.ts`, E2E admin (seccion Reclamos) | Unit + E2E | Cubierto (creacion por API) |

## Reporteria

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-REPORT-001 | Reporte de ocupacion | `reports.service.test.ts`, E2E admin | Unit + E2E | Cubierto |
| RF-REPORT-002 | Reporte de ingresos | `reports.service.test.ts`, E2E admin | Unit + E2E | Cubierto |
| RF-REPORT-003 | Reporte de transacciones y auditoria | `reports.service.test.ts` (rol operador vs admin, placa enmascarada) | Unitario | Cubierto |
| RF-REPORT-004 | Actividad de usuarios | `reports.service.test.ts` (ranking y productividad) | Unitario | Cubierto |
| RF-REPORT-005 | Cumplimiento legal | `reports.service.test.ts`, E2E admin | Unit + E2E | Cubierto |

## Offline, espacios, cliente y perfil

| RF | Descripcion | Prueba | Nivel | Estado |
|----|-------------|--------|-------|--------|
| RF-OFFLINE-001 | Operacion basica sin internet | `sync.test.ts` (receiveBatch, sync_log) | Unitario | Parcial (cliente SQLite/SQLCipher pendiente) |
| RF-OFFLINE-002 | Resolucion de conflictos | `sync.test.ts` (duplicados, local_wins) | Unitario | Cubierto |
| RF-ESPACIO-001 | Asignacion/liberacion y alertas | `spaces.test.ts`, `transactions.test.ts`, `flujo-entrada-salida.test.ts` | Unit + Integ | Cubierto |
| RF-CLIENTE-001 | Consulta segura de historial | `client.test.ts`, E2E cliente (email y login principal) | Unit + E2E | Cubierto |
| RF-PERFIL-001 | Acceso a configuracion de perfil | `profile.test.ts` | Unitario | Parcial (sin pagina de perfil en el SPA) |
| RF-PERFIL-002 | Notificaciones personalizadas | `profile.test.ts` (defaults y update) | Unitario | Cubierto |
| RF-PERFIL-003 | Cambio de contrasena seguro | `profile.test.ts` (actual incorrecta, reutilizacion, cierre de sesiones) | Unitario | Cubierto |
| RF-PERFIL-004 | Gestion de sesiones activas | `profile.test.ts` (closeSession, closeOtherSessions) | Unitario | Cubierto |
| RF-PERFIL-005 | Formato e idioma | Interfaz es-CO (sin test automatizado) | - | Parcial |
| RF-PERFIL-006 | Datos y privacidad (export) | `profile.test.ts` (exportUserData) | Unitario | Cubierto |
| RF-PERFIL-007 | Interfaz de perfil | - | - | Parcial (mockup en `docs/diseno/mockups`) |
| RF-INTEG-001 | API REST externa | API interna existente con Swagger | - | Futuro |

## Requerimientos no funcionales verificados

| RNF | Prueba / evidencia |
|-----|--------------------|
| RNF-SEG-001 (bcrypt, bloqueo) | `auth.test.ts` + `utils.test.ts` |
| RNF-SEG-002 (AES-256 placas) | `utils.test.ts`, `flujo-entrada-salida.test.ts` |
| RNF-SEG-004 (RBAC) | E2E de roles + `auth.test.ts` |
| RNF-MANT-002 (cobertura 80% critico) | `vitest.config.ts` + `informe-resultados.md` |
| RNF-USA-004 (es-CO) | Interfaz y documentacion en espanol |
