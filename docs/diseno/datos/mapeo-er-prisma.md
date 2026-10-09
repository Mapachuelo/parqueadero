# Mapeo entidad UML / modelo Prisma / tabla SQL

Correspondencia entre el diagrama ER (`er-modelo.drawio`), el modelo Prisma y las
tablas de `db/postgresql_schema.sql` y la migracion `20260522181540_init`.

| Entidad UML | Modelo Prisma | Tabla PostgreSQL | Campos |
|-------------|---------------|------------------|--------|
| User | `User` | `users` | 27 |
| UserSession | `UserSession` | `user_sessions` | 9 |
| UserNotificationPreference | `UserNotificationPreference` | `user_notification_preferences` | 17 |
| RateStructure | `RateStructure` | `rate_structures` | 9 |
| Rate | `Rate` | `rates` | 12 |
| RateChangeHistory | `RateChangeHistory` | `rate_change_history` | 8 |
| RateChangeNotification | `RateChangeNotification` | `rate_change_notifications` | 5 |
| FractionRate | `FractionRate` | `fraction_rates` | 9 |
| MonthlySubscription | `MonthlySubscription` | `monthly_subscriptions` | 16 |
| SubscriptionNotification | `SubscriptionNotification` | `subscription_notifications` | 6 |
| PrepaidCredit | `PrepaidCredit` | `prepaid_credits` | 15 |
| PrepaidMovement | `PrepaidMovement` | `prepaid_movements` | 8 |
| CreditNotification | `CreditNotification` | `credit_notifications` | 6 |
| VehicleTransaction | `VehicleTransaction` | `vehicle_transactions` | 36 |
| Payment | `Payment` | `payments` | 12 |
| CustodyTerms | `CustodyTerms` | `custody_terms` | 6 |
| Ticket | `Ticket` | `tickets` | 8 |
| ParkingSpace | `ParkingSpace` | `parking_spaces` | 6 |
| Claim | `Claim` | `claims` | 19 |
| ClaimEvidence | `ClaimEvidence` | `claim_evidence` | 7 |
| ClaimNote | `ClaimNote` | `claim_notes` | 6 |
| AuditLog | `AuditLog` | `audit_logs` | 11 |
| LegalChecklist | `LegalChecklist` | `legal_checklists` | 9 |
| LegalChecklistItem | `LegalChecklistItem` | `legal_checklist_items` | 8 |
| SystemConfig | `SystemConfig` | `system_config` | 3 |
| SyncLog | `SyncLog` | `sync_log` | 7 |
| SyncConflict | `SyncConflict` | `sync_conflicts` | 11 |
| MvDailyOccupancy | `MvDailyOccupancy` | `mv_daily_occupancy` | 5 |
| MvDailyRevenue | `MvDailyRevenue` | `mv_daily_revenue` | 4 |

> Las entidades `MvDailyOccupancy` y `MvDailyRevenue` son tablas de agregados
> (no vistas materializadas) segun la migracion; `db/postgresql_schema.sql` fue
> alineado a esta definicion.