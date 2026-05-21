-- ============================================================================
-- SQLite Schema - Base de datos LOCAL (Modo Offline)
-- Sistema de Gestión de Parqueaderos Públicos - Neiva, Colombia
-- ============================================================================
-- Propósito: Almacenamiento local en dispositivo para operación sin internet
-- Sincronización: La aplicación envía registros 'pending' al servidor PostgreSQL
-- Cifrado: Usar SQLCipher para cifrar la base de datos completa
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USUARIOS (Caché local para autenticación offline)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operador', 'cliente')),
    phone TEXT,
    email TEXT UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    last_login TEXT,
    session_token TEXT,
    session_expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

-- ----------------------------------------------------------------------------
-- 2. TARIFAS (Caché local de tarifas vigentes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL CHECK (category IN ('A', 'B', 'C', 'D')),
    price_per_hour INTEGER NOT NULL CHECK (price_per_hour > 0),
    name TEXT NOT NULL,
    description TEXT,
    valid_from TEXT NOT NULL,
    valid_to TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_rates_category_active ON rates(category, is_active);
CREATE INDEX IF NOT EXISTS idx_rates_validity ON rates(valid_from, valid_to);

-- Histórico de cambios tarifarios
CREATE TABLE IF NOT EXISTS rate_change_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate_id INTEGER NOT NULL,
    old_price INTEGER,
    new_price INTEGER NOT NULL,
    change_reason TEXT,
    changed_by INTEGER NOT NULL,
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (rate_id) REFERENCES rates(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_rate_history_rate ON rate_change_history(rate_id);
CREATE INDEX IF NOT EXISTS idx_rate_history_sync ON rate_change_history(sync_status);

-- ----------------------------------------------------------------------------
-- 2b. TARIFAS POR FRACCIÓN DE HORA (RF-TARIFA-004)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fraction_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL CHECK (category IN ('A', 'B', 'C', 'D')),
    minutes_15 INTEGER NOT NULL DEFAULT 0 CHECK (minutes_15 >= 0),
    minutes_30 INTEGER NOT NULL DEFAULT 0 CHECK (minutes_30 >= 0),
    minutes_45 INTEGER NOT NULL DEFAULT 0 CHECK (minutes_45 >= 0),
    is_enabled INTEGER NOT NULL DEFAULT 0,
    valid_from TEXT NOT NULL,
    valid_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_fraction_rates_category ON fraction_rates(category, is_enabled);
CREATE INDEX IF NOT EXISTS idx_fraction_rates_validity ON fraction_rates(valid_from, valid_to);

-- ----------------------------------------------------------------------------
-- 2c. MENSUALIDADES / SUSCRIPCIONES (RF-TARIFA-004)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT NOT NULL UNIQUE,
    plate_encrypted TEXT NOT NULL,
    plate_hash TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('A', 'B', 'C', 'D')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    monthly_amount INTEGER NOT NULL CHECK (monthly_amount > 0),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'vencida', 'cancelada')),
    auto_renew INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plate ON monthly_subscriptions(plate_hash);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON monthly_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON monthly_subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_sync ON monthly_subscriptions(sync_status);

-- ----------------------------------------------------------------------------
-- 2d. ABONOS / CRÉDITOS PREPAGADOS (RF-TARIFA-004)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prepaid_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_id TEXT NOT NULL UNIQUE,
    plate_encrypted TEXT NOT NULL,
    plate_hash TEXT NOT NULL,
    balance INTEGER NOT NULL CHECK (balance >= 0),
    original_amount INTEGER NOT NULL CHECK (original_amount > 0),
    currency_or_hours TEXT NOT NULL DEFAULT 'COP' CHECK (currency_or_hours IN ('COP', 'horas')),
    purchase_date TEXT NOT NULL,
    expiration_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'agotado', 'vencido')),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    purchased_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (purchased_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_credits_plate ON prepaid_credits(plate_hash);
CREATE INDEX IF NOT EXISTS idx_credits_status ON prepaid_credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_expiration ON prepaid_credits(expiration_date);
CREATE INDEX IF NOT EXISTS idx_credits_sync ON prepaid_credits(sync_status);

-- Historial de movimientos de abonos
CREATE TABLE IF NOT EXISTS prepaid_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_id TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('compra', 'recarga', 'consumo', 'reembolso', 'ajuste')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_id TEXT,
    operator_id INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (credit_id) REFERENCES prepaid_credits(credit_id)
);

CREATE INDEX IF NOT EXISTS idx_movements_credit ON prepaid_movements(credit_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON prepaid_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_sync ON prepaid_movements(sync_status);

-- ----------------------------------------------------------------------------
-- 3. TRANSACCIONES DE VEHÍCULOS (Entrada/Salida)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL UNIQUE,
    plate_encrypted TEXT NOT NULL,
    plate_hash TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('A', 'B', 'C', 'D')),
    entry_time TEXT NOT NULL,
    exit_time TEXT,
    duration_minutes INTEGER,
    rounded_hours INTEGER,
    billing_mode TEXT NOT NULL DEFAULT 'hora' CHECK (billing_mode IN ('hora', 'fraccion', 'mensualidad', 'abono', 'mixto')),
    rate_applied INTEGER,
    total_amount INTEGER,
    discount_amount INTEGER DEFAULT 0,
    discount_reason TEXT,
    final_amount INTEGER,
    prepaid_used INTEGER DEFAULT 0,
    prepaid_remaining INTEGER,
    subscription_id TEXT,
    credit_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'error')),
    space_assigned TEXT,
    operator_id INTEGER NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    is_international_plate INTEGER NOT NULL DEFAULT 0,
    country_origin TEXT,
    vehicle_description TEXT,
    entry_operator_id INTEGER,
    exit_operator_id INTEGER,
    customer_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (entry_operator_id) REFERENCES users(id),
    FOREIGN KEY (exit_operator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_plate ON vehicle_transactions(plate_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON vehicle_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_entry_time ON vehicle_transactions(entry_time);
CREATE INDEX IF NOT EXISTS idx_transactions_sync ON vehicle_transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON vehicle_transactions(transaction_id);

-- ----------------------------------------------------------------------------
-- 4. PAGOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'billetera_digital', 'abono')),
    amount_paid INTEGER NOT NULL,
    change_amount INTEGER DEFAULT 0,
    payment_reference TEXT,
    gateway_response TEXT,
    payment_time TEXT NOT NULL DEFAULT (datetime('now')),
    operator_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (transaction_id) REFERENCES vehicle_transactions(transaction_id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_sync ON payments(sync_status);

-- ----------------------------------------------------------------------------
-- 5. Tiquetes y Recibos (Metadatos para cumplimiento legal)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('entrada', 'salida')),
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    custody_terms_version TEXT NOT NULL,
    printed INTEGER NOT NULL DEFAULT 0,
    printed_at TEXT,
    operator_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (transaction_id) REFERENCES vehicle_transactions(transaction_id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_transaction ON tickets(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_sync ON tickets(sync_status);

-- ----------------------------------------------------------------------------
-- 6. AUDITORÍA (Log local de eventos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_sync ON audit_logs(sync_status);

-- ----------------------------------------------------------------------------
-- 7. COLA DE SINCRONIZACIÓN (Opcional, para tracking explícito)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    payload TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name, record_id);

-- ----------------------------------------------------------------------------
-- 8. CONFIGURACIÓN LOCAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Configuración inicial
INSERT OR IGNORE INTO app_config (key, value) VALUES
    ('sync_interval_seconds', '30'),
    ('session_timeout_minutes', '30'),
    ('free_minutes', '15'),
    ('rounding_policy', 'next_hour'),
    ('parking_capacity', '100'),
    ('occupancy_alert_90', '1'),
    ('occupancy_alert_95', '1'),
    ('occupancy_alert_99', '1'),
    ('custody_terms_version', '1.0'),
    ('last_sync_timestamp', '');

-- ----------------------------------------------------------------------------
-- 9. ESPACIOS DE PARQUEO (Opcional - RF-ESPACIO-001)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_code TEXT NOT NULL UNIQUE,
    zone TEXT NOT NULL DEFAULT 'A',
    is_occupied INTEGER NOT NULL DEFAULT 0,
    current_transaction_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_spaces_occupied ON parking_spaces(is_occupied);
CREATE INDEX IF NOT EXISTS idx_spaces_zone ON parking_spaces(zone);

-- ----------------------------------------------------------------------------
-- 10. RECLAMOS (Local - RF-LEGAL-004)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    category TEXT NOT NULL CHECK (category IN ('daño', 'cobro_incorrecto', 'robo_hurto', 'otro')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_investigacion', 'resuelto', 'rechazado')),
    resolution TEXT,
    resolution_date TEXT,
    customer_name TEXT,
    customer_contact TEXT,
    reported_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (transaction_id) REFERENCES vehicle_transactions(transaction_id),
    FOREIGN KEY (reported_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_transaction ON claims(transaction_id);
CREATE INDEX IF NOT EXISTS idx_claims_sync ON claims(sync_status);

-- Evidencia adjunta a reclamos
CREATE TABLE IF NOT EXISTS claim_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    description TEXT,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim ON claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_sync ON claim_evidence(sync_status);

-- ----------------------------------------------------------------------------
-- 11. CHECKLIST LEGAL DE PRE-OPERACIÓN (RF-LEGAL-002)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id TEXT NOT NULL UNIQUE,
    completed_by INTEGER NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_complete INTEGER NOT NULL DEFAULT 0,
    certificate_generated INTEGER NOT NULL DEFAULT 0,
    certificate_path TEXT,
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS legal_checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('normativa', 'documentacion', 'configuracion', 'capacitacion')),
    item_text TEXT NOT NULL,
    is_checked INTEGER NOT NULL DEFAULT 0,
    checked_at TEXT,
    notes TEXT,
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (checklist_id) REFERENCES legal_checklists(id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_list ON legal_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON legal_checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklists_sync ON legal_checklists(sync_status);

-- ----------------------------------------------------------------------------
-- 12. PREFERENCIAS DE NOTIFICACIÓN DE USUARIO (RF-PERFIL-002)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    notify_rate_change INTEGER NOT NULL DEFAULT 1,
    notify_occupancy_90 INTEGER NOT NULL DEFAULT 1,
    notify_occupancy_95 INTEGER NOT NULL DEFAULT 1,
    notify_occupancy_full INTEGER NOT NULL DEFAULT 1,
    notify_system_error INTEGER NOT NULL DEFAULT 1,
    notify_sync_failure INTEGER NOT NULL DEFAULT 1,
    notify_new_claim INTEGER NOT NULL DEFAULT 1,
    notify_unauthorized_access INTEGER NOT NULL DEFAULT 1,
    notify_daily_summary INTEGER NOT NULL DEFAULT 1,
    notify_printer_offline INTEGER NOT NULL DEFAULT 1,
    notify_payment_failure INTEGER NOT NULL DEFAULT 1,
    notify_session_expiring INTEGER NOT NULL DEFAULT 1,
    notification_channel_system INTEGER NOT NULL DEFAULT 1,
    notification_channel_email INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    server_id INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON user_notification_preferences(user_id);

-- ----------------------------------------------------------------------------
-- TRIGGERS para actualizar updated_at automáticamente
-- ----------------------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp
    AFTER UPDATE ON vehicle_transactions
    FOR EACH ROW
BEGIN
    UPDATE vehicle_transactions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_claims_timestamp
    AFTER UPDATE ON claims
    FOR EACH ROW
BEGIN
    UPDATE claims SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp
    AFTER UPDATE ON monthly_subscriptions
    FOR EACH ROW
BEGIN
    UPDATE monthly_subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_credits_timestamp
    AFTER UPDATE ON prepaid_credits
    FOR EACH ROW
BEGIN
    UPDATE prepaid_credits SET updated_at = datetime('now') WHERE id = NEW.id;
END;
