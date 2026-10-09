# Changelog

Todos los cambios relevantes del Sistema de Gestion de Parqueaderos Publicos.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y
Versionamiento Semantico.

## [1.1.0] - 2026-10-05

### Agregado

- Rol **cliente** operativo: alta desde el panel de usuarios, asociacion de la
  entrada con `customer_email` y **portal de clientes** con acceso por correo y
  por transaccion + ultimos 4 caracteres de la placa.
- Endpoint `GET /api/auth/users` (admin) y pagina de usuarios con listado real.
- Campo de correo electronico opcional en el registro de entrada.
- Documentacion de diseno: UML (casos de uso, clases, secuencias, componentes,
  despliegue, estados), mockups de interfaz y modelo de datos (ER, DBML,
  diccionario y mapeo Prisma) en `docs/diseno/`.
- Documentacion de calidad: plan de pruebas, matriz de trazabilidad RF-prueba e
  informe de resultados en `docs/calidad/`.
- Manuales: tecnico, de usuario y guia rapida en `docs/manuales/`.
- Pruebas: tests unitarios por modulo (154), de integracion con PostgreSQL (3) y
  E2E con Playwright para operador, admin y cliente (4); umbrales de cobertura en
  `vitest.config.ts`.
- SRS `docs/ieee830.md` version 1.1 (seccion 1.4, RF-SALIDA-003 y trazabilidad).

### Corregido

- Ticket de entrada mostraba placa, categoria y cliente vacios.
- La salida no registraba `exit_time` antes del pago (error 400).
- El paso de pago pedia el detalle por id numerico (404).
- El recibo leia una forma de respuesta incorrecta.
- El portal cliente no listaba el historial y mostraba la duracion como "Activo".
- `db/postgresql_schema.sql` no coincidia con la migracion en las tablas
  `mv_daily_*`.

### Cambiado

- El seed **siempre** genera claves aleatorias para admin/operador (se retiraron
  `SEED_*` del `.env` y la tabla de credenciales fijas del README).
- Los tags de imagen son `localhost/parqueadero-backend:latest` y
  `localhost/parqueadero-frontend:latest`.
- Documentacion actualizada: `README.md`, `AGENTS.md` y
  `.agents/skills/architecture.md`.

## [1.0.0] - 2026-05-22

### Agregado

- Version inicial del MVP: autenticacion con roles admin/operador, entrada y
  salida de vehiculos, calculo de tarifas (hora, fraccion, mensualidad, abono),
  pagos, tiquetes, reportes, reclamos, cumplimiento legal, espacios, perfil y
  sincronizacion offline.
- Despliegue con Podman (pods `parqueadero-db` y `parqueadero-app`).
- Documento SRS IEEE 830 (`docs/ieee830.md`).
