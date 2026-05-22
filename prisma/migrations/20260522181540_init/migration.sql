-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'operador', 'cliente');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('hora', 'fraccion', 'mensualidad', 'abono', 'mixto');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'billetera_digital', 'abono');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('abierto', 'en_investigacion', 'resuelto', 'rechazado', 'vencido');

-- CreateEnum
CREATE TYPE "ClaimCategory" AS ENUM ('danio', 'cobro_incorrecto', 'robo_hurto', 'perdida', 'otro');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('entrada', 'salida');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'synced', 'conflict');

-- CreateEnum
CREATE TYPE "ConflictType" AS ENUM ('duplicate', 'version_mismatch', 'data_conflict');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('local_wins', 'server_wins', 'manual', 'merged');

-- CreateEnum
CREATE TYPE "ChecklistItemCategory" AS ENUM ('normativa', 'documentacion', 'configuracion', 'capacitacion');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'operador',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "password_history" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rate_changes" BOOLEAN NOT NULL DEFAULT true,
    "occupancy_alerts" BOOLEAN NOT NULL DEFAULT true,
    "system_errors" BOOLEAN NOT NULL DEFAULT true,
    "sync_failures" BOOLEAN NOT NULL DEFAULT true,
    "claims" BOOLEAN NOT NULL DEFAULT true,
    "unauthorized_access" BOOLEAN NOT NULL DEFAULT true,
    "daily_summary" BOOLEAN NOT NULL DEFAULT false,
    "printer_offline" BOOLEAN NOT NULL DEFAULT true,
    "payment_failures" BOOLEAN NOT NULL DEFAULT true,
    "session_expiring" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_structures" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "effective_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rates" (
    "id" SERIAL NOT NULL,
    "structure_id" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "price_per_hour" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_change_history" (
    "id" SERIAL NOT NULL,
    "rate_id" INTEGER NOT NULL,
    "old_price" DECIMAL(10,2) NOT NULL,
    "new_price" DECIMAL(10,2) NOT NULL,
    "changed_by" INTEGER,
    "change_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_change_notifications" (
    "id" SERIAL NOT NULL,
    "rate_id" INTEGER NOT NULL,
    "notification_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_change_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraction_rates" (
    "id" SERIAL NOT NULL,
    "structure_id" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "minutes_15" DECIMAL(10,2) NOT NULL,
    "minutes_30" DECIMAL(10,2) NOT NULL,
    "minutes_45" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraction_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_subscriptions" (
    "id" SERIAL NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "plate_encrypted" BYTEA NOT NULL,
    "plate_hash" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "monthly_amount" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'activa',
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "registered_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_notifications" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "days_remaining" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prepaid_credits" (
    "id" SERIAL NOT NULL,
    "credit_id" TEXT NOT NULL,
    "plate_hash" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "balance" DECIMAL(10,2) NOT NULL,
    "original_amount" DECIMAL(10,2) NOT NULL,
    "is_hours" BOOLEAN NOT NULL DEFAULT false,
    "expiration_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "purchased_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prepaid_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prepaid_movements" (
    "id" SERIAL NOT NULL,
    "credit_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prepaid_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notifications" (
    "id" SERIAL NOT NULL,
    "credit_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_transactions" (
    "id" SERIAL NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "plate_encrypted" BYTEA NOT NULL,
    "plate_hash" TEXT NOT NULL,
    "plate" TEXT,
    "category" "Category" NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "is_international" BOOLEAN NOT NULL DEFAULT false,
    "country_origin" TEXT,
    "vehicle_description" TEXT,
    "entry_time" TIMESTAMP(3) NOT NULL,
    "exit_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "rounded_hours" INTEGER,
    "billing_mode" "BillingMode",
    "rate_per_hour" DECIMAL(10,2),
    "fraction_rate_used" TEXT,
    "total_amount" DECIMAL(10,2),
    "discount_amount" DECIMAL(10,2) DEFAULT 0,
    "final_amount" DECIMAL(10,2),
    "subscription_id" INTEGER,
    "credit_used" DECIMAL(10,2),
    "status" "TransactionStatus" NOT NULL DEFAULT 'active',
    "space_assigned" TEXT,
    "entry_operator_id" INTEGER,
    "exit_operator_id" INTEGER,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "change_amount" DECIMAL(10,2),
    "prepaid_used" DECIMAL(10,2),
    "gateway_response" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'completed',
    "operator_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custody_terms" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custody_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "ticket_type" "TicketType" NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "custody_terms_version" TEXT,
    "print_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spaces" (
    "id" SERIAL NOT NULL,
    "space_code" TEXT NOT NULL,
    "zone" TEXT,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "current_transaction_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" SERIAL NOT NULL,
    "claim_id" TEXT NOT NULL,
    "transaction_id" INTEGER,
    "reported_by" INTEGER,
    "assigned_to" INTEGER,
    "category" "ClaimCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'abierto',
    "resolution" TEXT,
    "compensation_amount" DECIMAL(10,2),
    "resolution_date" TIMESTAMP(3),
    "resolution_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_evidence" (
    "id" SERIAL NOT NULL,
    "claim_id" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "description" TEXT,
    "uploaded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_notes" (
    "id" SERIAL NOT NULL,
    "claim_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_checklists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_checklist_items" (
    "id" SERIAL NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "category" "ChecklistItemCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_by" INTEGER,
    "checked_at" TIMESTAMP(3),

    CONSTRAINT "legal_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "synced_count" INTEGER NOT NULL DEFAULT 0,
    "conflict_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "local_record_id" TEXT NOT NULL,
    "server_record_id" TEXT,
    "conflict_type" "ConflictType" NOT NULL,
    "local_data" JSONB NOT NULL,
    "server_data" JSONB,
    "resolution" "ConflictResolution",
    "resolved_by" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mv_daily_occupancy" (
    "date_hour" TIMESTAMP(3) NOT NULL,
    "total_spaces" INTEGER NOT NULL,
    "occupied_spaces" INTEGER NOT NULL,
    "free_spaces" INTEGER NOT NULL,
    "occupancy_pct" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "mv_daily_occupancy_pkey" PRIMARY KEY ("date_hour")
);

-- CreateTable
CREATE TABLE "mv_daily_revenue" (
    "date" TIMESTAMP(3) NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL,
    "avg_per_transaction" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "mv_daily_revenue_pkey" PRIMARY KEY ("date")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_user_id_key" ON "user_notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_subscriptions_subscription_id_key" ON "monthly_subscriptions"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "prepaid_credits_credit_id_key" ON "prepaid_credits"("credit_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_transactions_transaction_id_key" ON "vehicle_transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "vehicle_transactions_plate_hash_idx" ON "vehicle_transactions"("plate_hash");

-- CreateIndex
CREATE INDEX "vehicle_transactions_status_idx" ON "vehicle_transactions"("status");

-- CreateIndex
CREATE INDEX "vehicle_transactions_entry_time_idx" ON "vehicle_transactions"("entry_time");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "custody_terms_version_key" ON "custody_terms"("version");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spaces_space_code_key" ON "parking_spaces"("space_code");

-- CreateIndex
CREATE UNIQUE INDEX "claims_claim_id_key" ON "claims"("claim_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rates" ADD CONSTRAINT "rates_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "rate_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_change_history" ADD CONSTRAINT "rate_change_history_rate_id_fkey" FOREIGN KEY ("rate_id") REFERENCES "rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraction_rates" ADD CONSTRAINT "fraction_rates_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "rate_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_subscriptions" ADD CONSTRAINT "monthly_subscriptions_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepaid_credits" ADD CONSTRAINT "prepaid_credits_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepaid_movements" ADD CONSTRAINT "prepaid_movements_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "prepaid_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_transactions" ADD CONSTRAINT "vehicle_transactions_entry_operator_id_fkey" FOREIGN KEY ("entry_operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_transactions" ADD CONSTRAINT "vehicle_transactions_exit_operator_id_fkey" FOREIGN KEY ("exit_operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "vehicle_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "vehicle_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "vehicle_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_notes" ADD CONSTRAINT "claim_notes_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_checklists" ADD CONSTRAINT "legal_checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_checklist_items" ADD CONSTRAINT "legal_checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "legal_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
