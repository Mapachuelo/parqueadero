# Diccionario de datos

Generado automaticamente desde `src/db/prisma/schema.prisma` (PostgreSQL 16).
Fuente de verdad: migracion `20260522181540_init`. Regenerar con
`python3 docs/diseno/tools/generar-datos.py`.

Total de entidades: **29**.

## Convenciones

- `PK`: clave primaria. `FK`: clave foranea. `UQ`: unico.
- Tipos SQL indicativos; Prisma es la definicion oficial.
- `?` indica campo opcional (nullable).

---

## User

Tabla: `users`

Usuarios del sistema (admin, operador, cliente) con credenciales y estado.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `uuid` | String | VARCHAR / TEXT | No | UQ | Identificador publico unico. |
| `username` | String | VARCHAR / TEXT | No | UQ | Nombre de usuario para autenticacion. |
| `password_hash` | String | VARCHAR / TEXT | No | - | - |
| `full_name` | String | VARCHAR / TEXT | No | - | - |
| `email` | String | VARCHAR / TEXT | No | UQ | Correo electronico. |
| `phone` | String | VARCHAR / TEXT | Si | - | - |
| `role` | Role | Role | No | - | Rol del usuario (admin, operador, cliente). |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `must_change_password` | Boolean | BOOLEAN | No | - | - |
| `failed_login_attempts` | Int | INTEGER | No | - | - |
| `locked_until` | DateTime | TIMESTAMP(3) | Si | - | - |
| `last_login` | DateTime | TIMESTAMP(3) | Si | - | - |
| `password_history` | String | VARCHAR / TEXT | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `sessions` | UserSession | UserSession | No | - | - |
| `transactionsOperator` | VehicleTransaction | VehicleTransaction | No | - | - |
| `transactionsExitOp` | VehicleTransaction | VehicleTransaction | No | - | - |
| `payments` | Payment | Payment | No | - | - |
| `auditLogs` | AuditLog | AuditLog | No | - | - |
| `claimsReported` | Claim | Claim | No | - | - |
| `claimsAssigned` | Claim | Claim | No | - | - |
| `legalChecklists` | LegalChecklist | LegalChecklist | No | - | - |
| `subscriptionsRegistered` | MonthlySubscription | MonthlySubscription | No | - | - |
| `creditsPurchased` | PrepaidCredit | PrepaidCredit | No | - | - |
| `notificationPreferences` | UserNotificationPreference | UserNotificationPreference | Si | - | - |

## UserSession

Tabla: `user_sessions`

Sesiones JWT activas por usuario (login/logout y expiracion).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `user_id` | Int | INTEGER | No | - | - |
| `token` | String | VARCHAR / TEXT | No | UQ | Token de sesion JWT. |
| `expires_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de expiracion de la sesion. |
| `ip_address` | String | VARCHAR / TEXT | Si | - | - |
| `user_agent` | String | VARCHAR / TEXT | Si | - | - |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `user` | User | User | No | FK | - |

## UserNotificationPreference

Tabla: `user_notification_preferences`

Preferencias de notificacion por usuario y tipo (RF-PERFIL-002).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `user_id` | Int | INTEGER | No | UQ | - |
| `rate_changes` | Boolean | BOOLEAN | No | - | - |
| `occupancy_alerts` | Boolean | BOOLEAN | No | - | - |
| `system_errors` | Boolean | BOOLEAN | No | - | - |
| `sync_failures` | Boolean | BOOLEAN | No | - | - |
| `claims` | Boolean | BOOLEAN | No | - | - |
| `unauthorized_access` | Boolean | BOOLEAN | No | - | - |
| `daily_summary` | Boolean | BOOLEAN | No | - | - |
| `printer_offline` | Boolean | BOOLEAN | No | - | - |
| `payment_failures` | Boolean | BOOLEAN | No | - | - |
| `session_expiring` | Boolean | BOOLEAN | No | - | - |
| `email_enabled` | Boolean | BOOLEAN | No | - | - |
| `push_enabled` | Boolean | BOOLEAN | No | - | - |
| `sms_enabled` | Boolean | BOOLEAN | No | - | - |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `user` | User | User | No | FK | - |

## RateStructure

Tabla: `rate_structures`

Estructura tarifaria con vigencia (RF-TARIFA-001/002).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `name` | String | VARCHAR / TEXT | No | - | Nombre descriptivo del registro. |
| `description` | String | VARCHAR / TEXT | Si | - | Descripcion del registro. |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `effective_date` | DateTime | TIMESTAMP(3) | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `rates` | Rate | Rate | No | - | - |
| `fractionRates` | FractionRate | FractionRate | No | - | - |

## Rate

Tabla: `rates`

Tarifa por hora por categoria dentro de una estructura.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `structure_id` | Int | INTEGER | No | - | - |
| `category` | Category | Category | No | - | Categoria del vehiculo (A, B, C, D). |
| `price_per_hour` | Decimal | DECIMAL | No | - | - |
| `description` | String | VARCHAR / TEXT | Si | - | Descripcion del registro. |
| `valid_from` | DateTime | TIMESTAMP(3) | Si | - | - |
| `valid_to` | DateTime | TIMESTAMP(3) | Si | - | - |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `structure` | RateStructure | RateStructure | No | FK | - |
| `changeHistory` | RateChangeHistory | RateChangeHistory | No | - | - |

## RateChangeHistory

Tabla: `rate_change_history`

Historico de cambios tarifarios (auditoria).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `rate_id` | Int | INTEGER | No | - | - |
| `old_price` | Decimal | DECIMAL | No | - | - |
| `new_price` | Decimal | DECIMAL | No | - | - |
| `changed_by` | Int | INTEGER | Si | - | - |
| `change_reason` | String | VARCHAR / TEXT | Si | - | - |
| `changed_at` | DateTime | TIMESTAMP(3) | No | - | - |
| `rate` | Rate | Rate | No | FK | - |

## RateChangeNotification

Tabla: `rate_change_notifications`

Notificaciones de cambio tarifario (RF-TARIFA-003).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `rate_id` | Int | INTEGER | No | - | - |
| `notification_type` | String | VARCHAR / TEXT | No | - | - |
| `message` | String | VARCHAR / TEXT | No | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |

## FractionRate

Tabla: `fraction_rates`

Tarifa por fraccion de 15/30/45 minutos por categoria (RF-TARIFA-004).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `structure_id` | Int | INTEGER | No | - | - |
| `category` | Category | Category | No | - | Categoria del vehiculo (A, B, C, D). |
| `minutes_15` | Decimal | DECIMAL | No | - | - |
| `minutes_30` | Decimal | DECIMAL | No | - | - |
| `minutes_45` | Decimal | DECIMAL | No | - | - |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `structure` | RateStructure | RateStructure | No | FK | - |

## MonthlySubscription

Tabla: `monthly_subscriptions`

Suscripcion mensual por placa (RF-TARIFA-004).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `subscription_id` | String | VARCHAR / TEXT | No | UQ | - |
| `plate_encrypted` | Bytes | BYTEA | No | - | Placa cifrada con AES-256-GCM. |
| `plate_hash` | String | VARCHAR / TEXT | No | - | Hash SHA-256 de la placa (busqueda sin descifrar). |
| `customer_name` | String | VARCHAR / TEXT | No | - | Nombre del propietario/conductor. |
| `customer_phone` | String | VARCHAR / TEXT | Si | - | Telefono de contacto. |
| `customer_email` | String | VARCHAR / TEXT | Si | - | Correo del cliente (asocia el portal cliente). |
| `monthly_amount` | Decimal | DECIMAL | No | - | - |
| `start_date` | DateTime | TIMESTAMP(3) | No | - | - |
| `end_date` | DateTime | TIMESTAMP(3) | No | - | - |
| `status` | String | VARCHAR / TEXT | No | - | Estado del registro segun su ciclo de vida. |
| `auto_renew` | Boolean | BOOLEAN | No | - | - |
| `registered_by` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `registrant` | User | User | Si | FK | - |

## SubscriptionNotification

Tabla: `subscription_notifications`

Notificaciones de vencimiento de mensualidad.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `subscription_id` | Int | INTEGER | No | - | - |
| `message` | String | VARCHAR / TEXT | No | - | - |
| `days_remaining` | Int | INTEGER | No | - | - |
| `read` | Boolean | BOOLEAN | No | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |

## PrepaidCredit

Tabla: `prepaid_credits`

Abono/crédito prepagado por placa (RF-TARIFA-004).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `credit_id` | String | VARCHAR / TEXT | No | UQ | - |
| `plate_hash` | String | VARCHAR / TEXT | No | - | Hash SHA-256 de la placa (busqueda sin descifrar). |
| `customer_name` | String | VARCHAR / TEXT | No | - | Nombre del propietario/conductor. |
| `customer_phone` | String | VARCHAR / TEXT | Si | - | Telefono de contacto. |
| `balance` | Decimal | DECIMAL | No | - | - |
| `original_amount` | Decimal | DECIMAL | No | - | - |
| `is_hours` | Boolean | BOOLEAN | No | - | - |
| `expiration_date` | DateTime | TIMESTAMP(3) | Si | - | - |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `purchased_by` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `purchaser` | User | User | Si | FK | - |
| `movements` | PrepaidMovement | PrepaidMovement | No | - | - |

## PrepaidMovement

Tabla: `prepaid_movements`

Movimientos de consumo/recarga de un abono.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `credit_id` | Int | INTEGER | No | - | - |
| `type` | String | VARCHAR / TEXT | No | - | - |
| `amount` | Decimal | DECIMAL | No | - | - |
| `balance_after` | Decimal | DECIMAL | No | - | - |
| `reference` | String | VARCHAR / TEXT | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `credit` | PrepaidCredit | PrepaidCredit | No | FK | - |

## CreditNotification

Tabla: `credit_notifications`

Notificaciones de saldo bajo de abono.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `credit_id` | Int | INTEGER | No | - | - |
| `message` | String | VARCHAR / TEXT | No | - | - |
| `percentage` | Decimal | DECIMAL | No | - | - |
| `read` | Boolean | BOOLEAN | No | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |

## VehicleTransaction

Tabla: `vehicle_transactions`

Transaccion de entrada/salida de un vehiculo (nucleo del negocio).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `transaction_id` | String | VARCHAR / TEXT | No | UQ | Identificador de negocio de la transaccion (TXN-...). |
| `plate_encrypted` | Bytes | BYTEA | No | - | Placa cifrada con AES-256-GCM. |
| `plate_hash` | String | VARCHAR / TEXT | No | - | Hash SHA-256 de la placa (busqueda sin descifrar). |
| `plate` | String | VARCHAR / TEXT | Si | - | Placa en claro (solo si aplica). |
| `category` | Category | Category | No | - | Categoria del vehiculo (A, B, C, D). |
| `customer_name` | String | VARCHAR / TEXT | No | - | Nombre del propietario/conductor. |
| `customer_phone` | String | VARCHAR / TEXT | Si | - | Telefono de contacto. |
| `customer_email` | String | VARCHAR / TEXT | Si | - | Correo del cliente (asocia el portal cliente). |
| `is_international` | Boolean | BOOLEAN | No | - | - |
| `country_origin` | String | VARCHAR / TEXT | Si | - | - |
| `vehicle_description` | String | VARCHAR / TEXT | Si | - | - |
| `entry_time` | DateTime | TIMESTAMP(3) | No | - | Fecha y hora de entrada. |
| `exit_time` | DateTime | TIMESTAMP(3) | Si | - | Fecha y hora de salida. |
| `duration_minutes` | Int | INTEGER | Si | - | Duracion real en minutos. |
| `rounded_hours` | Int | INTEGER | Si | - | - |
| `billing_mode` | BillingMode | BillingMode | Si | - | - |
| `rate_per_hour` | Decimal | DECIMAL | Si | - | - |
| `fraction_rate_used` | String | VARCHAR / TEXT | Si | - | - |
| `total_amount` | Decimal | DECIMAL | Si | - | Monto bruto antes de descuentos. |
| `discount_amount` | Decimal | DECIMAL | Si | - | - |
| `final_amount` | Decimal | DECIMAL | Si | - | Monto final a pagar en COP. |
| `subscription_id` | Int | INTEGER | Si | - | - |
| `credit_used` | Decimal | DECIMAL | Si | - | - |
| `status` | TransactionStatus | TransactionStatus | No | - | Estado del registro segun su ciclo de vida. |
| `space_assigned` | String | VARCHAR / TEXT | Si | - | Codigo del espacio asignado. |
| `entry_operator_id` | Int | INTEGER | Si | - | - |
| `exit_operator_id` | Int | INTEGER | Si | - | - |
| `sync_status` | SyncStatus | SyncStatus | No | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `entryOperator` | User | User | Si | FK | - |
| `exitOperator` | User | User | Si | FK | - |
| `payment` | Payment | Payment | Si | - | - |
| `tickets` | Ticket | Ticket | No | - | - |
| `claims` | Claim | Claim | No | - | - |

## Payment

Tabla: `payments`

Pago asociado a una transaccion (metodo, monto, cambio, abono usado).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `transaction_id` | Int | INTEGER | No | UQ | Identificador de negocio de la transaccion (TXN-...). |
| `payment_method` | PaymentMethod | PaymentMethod | No | - | Metodo de pago utilizado. |
| `amount_paid` | Decimal | DECIMAL | No | - | Monto efectivamente recibido. |
| `change_amount` | Decimal | DECIMAL | Si | - | Cambio devuelto (pago en efectivo). |
| `prepaid_used` | Decimal | DECIMAL | Si | - | - |
| `gateway_response` | String | VARCHAR / TEXT | Si | - | - |
| `status` | PaymentStatus | PaymentStatus | No | - | Estado del registro segun su ciclo de vida. |
| `operator_id` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `transaction` | VehicleTransaction | VehicleTransaction | No | FK | - |
| `operator` | User | User | Si | FK | - |

## CustodyTerms

Tabla: `custody_terms`

Versiones de los terminos de custodia (RF-LEGAL-001).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `version` | String | VARCHAR / TEXT | No | UQ | Version del documento legal. |
| `content` | String | VARCHAR / TEXT | No | - | - |
| `is_active` | Boolean | BOOLEAN | No | - | Indica si el registro esta vigente. |
| `created_by` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |

## Ticket

Tabla: `tickets`

Tiquete de entrada o recibo de salida emitido (cumplimiento legal).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `transaction_id` | Int | INTEGER | No | - | Identificador de negocio de la transaccion (TXN-...). |
| `ticket_type` | TicketType | TicketType | No | - | - |
| `ticket_number` | String | VARCHAR / TEXT | No | UQ | - |
| `custody_terms_version` | String | VARCHAR / TEXT | Si | - | - |
| `print_count` | Int | INTEGER | No | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `transaction` | VehicleTransaction | VehicleTransaction | No | FK | - |

## ParkingSpace

Tabla: `parking_spaces`

Espacio fisico de parqueo y su estado de ocupacion (RF-ESPACIO-001).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `space_code` | String | VARCHAR / TEXT | No | UQ | - |
| `zone` | String | VARCHAR / TEXT | Si | - | - |
| `is_occupied` | Boolean | BOOLEAN | No | - | - |
| `current_transaction_id` | String | VARCHAR / TEXT | Si | - | - |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |

## Claim

Tabla: `claims`

Reclamo del cliente (dano, cobro incorrecto, robo/hurto, perdida).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `claim_id` | String | VARCHAR / TEXT | No | UQ | - |
| `transaction_id` | Int | INTEGER | Si | - | Identificador de negocio de la transaccion (TXN-...). |
| `reported_by` | Int | INTEGER | Si | - | - |
| `assigned_to` | Int | INTEGER | Si | - | - |
| `category` | ClaimCategory | ClaimCategory | No | - | Categoria del vehiculo (A, B, C, D). |
| `description` | String | VARCHAR / TEXT | No | - | Descripcion del registro. |
| `status` | ClaimStatus | ClaimStatus | No | - | Estado del registro segun su ciclo de vida. |
| `resolution` | String | VARCHAR / TEXT | Si | - | - |
| `compensation_amount` | Decimal | DECIMAL | Si | - | - |
| `resolution_date` | DateTime | TIMESTAMP(3) | Si | - | - |
| `resolution_deadline` | DateTime | TIMESTAMP(3) | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `updated_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de ultima actualizacion. |
| `transaction` | VehicleTransaction | VehicleTransaction | Si | FK | - |
| `reporter` | User | User | Si | FK | - |
| `investigator` | User | User | Si | FK | - |
| `evidence` | ClaimEvidence | ClaimEvidence | No | - | - |
| `notes` | ClaimNote | ClaimNote | No | - | - |

## ClaimEvidence

Tabla: `claim_evidence`

Evidencia adjunta de un reclamo (archivos).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `claim_id` | Int | INTEGER | No | - | - |
| `file_path` | String | VARCHAR / TEXT | No | - | - |
| `description` | String | VARCHAR / TEXT | Si | - | Descripcion del registro. |
| `uploaded_by` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `claim` | Claim | Claim | No | FK | - |

## ClaimNote

Tabla: `claim_notes`

Notas de seguimiento de un reclamo.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `claim_id` | Int | INTEGER | No | - | - |
| `content` | String | VARCHAR / TEXT | No | - | - |
| `author_id` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `claim` | Claim | Claim | No | FK | - |

## AuditLog

Tabla: `audit_logs`

Registro inmutable de auditoria: quien, que, cuando y resultado.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | BigInt | BIGINT | No | PK | Identificador interno autoincremental. |
| `user_id` | Int | INTEGER | Si | - | - |
| `action` | String | VARCHAR / TEXT | No | - | - |
| `entity_type` | String | VARCHAR / TEXT | Si | - | - |
| `entity_id` | String | VARCHAR / TEXT | Si | - | - |
| `old_values` | Json | JSONB | Si | - | - |
| `new_values` | Json | JSONB | Si | - | - |
| `ip_address` | String | VARCHAR / TEXT | Si | - | - |
| `user_agent` | String | VARCHAR / TEXT | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `user` | User | User | Si | FK | - |

## LegalChecklist

Tabla: `legal_checklists`

Checklist legal de pre-operacion (RF-LEGAL-002).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `name` | String | VARCHAR / TEXT | No | - | Nombre descriptivo del registro. |
| `description` | String | VARCHAR / TEXT | Si | - | Descripcion del registro. |
| `is_complete` | Boolean | BOOLEAN | No | - | - |
| `completed_at` | DateTime | TIMESTAMP(3) | Si | - | - |
| `created_by` | Int | INTEGER | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |
| `items` | LegalChecklistItem | LegalChecklistItem | No | - | - |
| `creator` | User | User | Si | FK | - |

## LegalChecklistItem

Tabla: `legal_checklist_items`

Item verificable de un checklist legal.

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `checklist_id` | Int | INTEGER | No | - | - |
| `category` | ChecklistItemCategory | ChecklistItemCategory | No | - | Categoria del vehiculo (A, B, C, D). |
| `description` | String | VARCHAR / TEXT | No | - | Descripcion del registro. |
| `is_checked` | Boolean | BOOLEAN | No | - | - |
| `checked_by` | Int | INTEGER | Si | - | - |
| `checked_at` | DateTime | TIMESTAMP(3) | Si | - | - |
| `checklist` | LegalChecklist | LegalChecklist | No | FK | - |

## SystemConfig

Tabla: `system_config`

Configuracion global del sistema (clave/valor).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `key` | String | VARCHAR / TEXT | No | UQ | - |
| `value` | String | VARCHAR / TEXT | No | - | - |

## SyncLog

Tabla: `sync_log`

Bitacora de sincronizacion offline (RF-OFFLINE-001).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `device_id` | String | VARCHAR / TEXT | No | - | - |
| `synced_count` | Int | INTEGER | No | - | - |
| `conflict_count` | Int | INTEGER | No | - | - |
| `status` | String | VARCHAR / TEXT | No | - | Estado del registro segun su ciclo de vida. |
| `message` | String | VARCHAR / TEXT | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |

## SyncConflict

Tabla: `sync_conflicts`

Conflictos de sincronizacion para revision manual (RF-OFFLINE-002).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `id` | Int | INTEGER | No | PK | Identificador interno autoincremental. |
| `table_name` | String | VARCHAR / TEXT | No | - | - |
| `local_record_id` | String | VARCHAR / TEXT | No | - | - |
| `server_record_id` | String | VARCHAR / TEXT | Si | - | - |
| `conflict_type` | ConflictType | ConflictType | No | - | - |
| `local_data` | Json | JSONB | No | - | - |
| `server_data` | Json | JSONB | Si | - | - |
| `resolution` | ConflictResolution | ConflictResolution | Si | - | - |
| `resolved_by` | Int | INTEGER | Si | - | - |
| `resolved_at` | DateTime | TIMESTAMP(3) | Si | - | - |
| `created_at` | DateTime | TIMESTAMP(3) | No | - | Fecha de creacion del registro. |

## MvDailyOccupancy

Tabla: `mv_daily_occupancy`

Agregado diario de ocupacion para reportes (snapshot).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `date_hour` | DateTime | TIMESTAMP(3) | No | PK | Hora agregada del snapshot. |
| `total_spaces` | Int | INTEGER | No | - | Total de espacios del parqueadero. |
| `occupied_spaces` | Int | INTEGER | No | - | Espacios ocupados. |
| `free_spaces` | Int | INTEGER | No | - | Espacios libres. |
| `occupancy_pct` | Decimal | DECIMAL | No | - | Porcentaje de ocupacion. |

## MvDailyRevenue

Tabla: `mv_daily_revenue`

Agregado diario de ingresos para reportes (snapshot).

| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |
|-------|-------------|----------|------|-------|-------------|
| `date` | DateTime | TIMESTAMP(3) | No | PK | - |
| `total_transactions` | Int | INTEGER | No | - | Numero de transacciones agregadas. |
| `total_revenue` | Decimal | DECIMAL | No | - | Ingresos agregados en COP. |
| `avg_per_transaction` | Decimal | DECIMAL | No | - | - |
