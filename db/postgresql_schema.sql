-- ============================================================================
-- PostgreSQL Schema - Base de datos CENTRAL (Servidor)
-- Sistema de Gestión de Parqueaderos Públicos - Neiva, Colombia
-- ============================================================================
-- Propósito: Base de datos principal del servidor para operación multi-usuario
-- Sincronización: Recibe datos de dispositivos SQLite vía API REST
-- Cifrado: pgcrypto para placas y datos sensibles
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ESQUEMA DE USUARIOS Y AUTENTICACIÓN
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operador', 'cliente')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    session_token VARCHAR(255),
    session_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Tabla de sesiones activas
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ----------------------------------------------------------------------------
-- 2. TARIFAS Y ESTRUCTURA TARIFARIA
-- ----------------------------------------------------------------------------
CREATE TABLE rate_structures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE rates (
    id SERIAL PRIMARY KEY,
    rate_structure_id INTEGER NOT NULL REFERENCES rate_structures(id) ON DELETE CASCADE,
    category VARCHAR(1) NOT NULL CHECK (category IN ('A', 'B', 'C', 'D')),
    price_per_hour INTEGER NOT NULL CHECK (price_per_hour > 0),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES users(id),
    UNIQUE (rate_structure_id, category, valid_from)
);

CREATE INDEX idx_rates_category ON rates(category);
CREATE INDEX idx_rates_active ON rates(is_active);
CREATE INDEX idx_rates_validity ON rates(valid_from, valid_to);
CREATE INDEX idx_rates_structure ON rates(rate_structure_id);

-- Histórico de cambios tarifarios
CREATE TABLE rate_change_history (
    id SERIAL PRIMARY KEY,
    rate_id INTEGER NOT NULL REFERENCES rates(id),
    old_price INTEGER,
    new_price INTEGER NOT NULL,
    change_reason TEXT,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notificaciones de cambio tarifario
CREATE TABLE rate_change_notifications (
    id SERIAL PRIMARY KEY,
    rate_id INTEGER NOT NULL REFERENCES rates(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    notification_type VARCHAR(20) CHECK (notification_type IN ('admin', 'operador', 'cliente')),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON rate_change_notifications(user_id);
CREATE INDEX idx_notifications_read ON rate_change_notifications(is_read);

-- ----------------------------------------------------------------------------
-- 3. TRANSACCIONES DE VEHÍCULOS
-- ----------------------------------------------------------------------------
CREATE TABLE vehicle_transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    plate_encrypted BYTEA NOT NULL,
    plate_hash VARCHAR(64) NOT NULL,
    category VARCHAR(1) NOT NULL CHECK (category IN ('A', 'B', 'C', 'D')),
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    duration_minutes INTEGER,
    rounded_hours INTEGER,
    rate_id INTEGER REFERENCES rates(id),
    rate_applied INTEGER,
    total_amount INTEGER,
    discount_amount INTEGER DEFAULT 0,
    discount_reason VARCHAR(200),
    final_amount INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'error')),
    space_assigned VARCHAR(10),
    operator_id INTEGER NOT NULL REFERENCES users(id),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    is_international_plate BOOLEAN NOT NULL DEFAULT false,
    country_origin VARCHAR(50),
    vehicle_description TEXT,
    entry_operator_id INTEGER REFERENCES users(id),
    exit_operator_id INTEGER REFERENCES users(id),
    source_device VARCHAR(50),
    synced_from_local BOOLEAN NOT NULL DEFAULT false,
    local_record_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_plate ON vehicle_transactions(plate_hash);
CREATE INDEX idx_transactions_status ON vehicle_transactions(status);
CREATE INDEX idx_transactions_entry_time ON vehicle_transactions(entry_time);
CREATE INDEX idx_transactions_exit_time ON vehicle_transactions(exit_time);
CREATE INDEX idx_transactions_operator ON vehicle_transactions(operator_id);
CREATE INDEX idx_transactions_category ON vehicle_transactions(category);
CREATE INDEX idx_transactions_transaction_id ON vehicle_transactions(transaction_id);
CREATE INDEX idx_transactions_synced ON vehicle_transactions(synced_from_local);

-- ----------------------------------------------------------------------------
-- 4. PAGOS
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL REFERENCES vehicle_transactions(transaction_id),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'billetera_digital')),
    amount_paid INTEGER NOT NULL,
    change_amount INTEGER DEFAULT 0,
    payment_reference VARCHAR(100),
    gateway_response TEXT,
    payment_time TIMESTAMP NOT NULL DEFAULT NOW(),
    operator_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_time ON payments(payment_time);

-- ----------------------------------------------------------------------------
-- 5. TIQUETES Y RECIBOS (Cumplimiento legal)
-- ----------------------------------------------------------------------------
CREATE TABLE custody_terms (
    id SERIAL PRIMARY KEY,
    version VARCHAR(10) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL REFERENCES vehicle_transactions(transaction_id),
    ticket_type VARCHAR(10) NOT NULL CHECK (ticket_type IN ('entrada', 'salida')),
    issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    custody_terms_version VARCHAR(10) NOT NULL REFERENCES custody_terms(version),
    printed BOOLEAN NOT NULL DEFAULT false,
    printed_at TIMESTAMP,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_transaction ON tickets(transaction_id);
CREATE INDEX idx_tickets_type ON tickets(ticket_type);
CREATE INDEX idx_tickets_issued ON tickets(issued_at);

-- ----------------------------------------------------------------------------
-- 6. ESPACIOS DE PARQUEO (Opcional - RF-ESPACIO-001)
-- ----------------------------------------------------------------------------
CREATE TABLE parking_spaces (
    id SERIAL PRIMARY KEY,
    space_code VARCHAR(10) NOT NULL UNIQUE,
    zone VARCHAR(5) NOT NULL DEFAULT 'A',
    is_occupied BOOLEAN NOT NULL DEFAULT false,
    current_transaction_id VARCHAR(50) REFERENCES vehicle_transactions(transaction_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spaces_occupied ON parking_spaces(is_occupied);
CREATE INDEX idx_spaces_zone ON parking_spaces(zone);
CREATE INDEX idx_spaces_transaction ON parking_spaces(current_transaction_id);

-- ----------------------------------------------------------------------------
-- 7. RECLAMOS (RF-LEGAL-004)
-- ----------------------------------------------------------------------------
CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    claim_id VARCHAR(50) NOT NULL UNIQUE,
    transaction_id VARCHAR(50) REFERENCES vehicle_transactions(transaction_id),
    category VARCHAR(30) NOT NULL CHECK (category IN ('daño', 'cobro_incorrecto', 'robo_hurto', 'perdida', 'otro')),
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_investigacion', 'resuelto', 'rechazado', 'vencido')),
    resolution TEXT,
    resolution_date TIMESTAMP,
    resolution_deadline TIMESTAMP,
    customer_name VARCHAR(100),
    customer_contact VARCHAR(100),
    customer_email VARCHAR(100),
    reported_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    compensation_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_transaction ON claims(transaction_id);
CREATE INDEX idx_claims_deadline ON claims(resolution_deadline);
CREATE INDEX idx_claims_category ON claims(category);

-- Evidencia adjunta a reclamos
CREATE TABLE claim_evidence (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    description TEXT,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notas de investigación de reclamos
CREATE TABLE claim_notes (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. AUDITORÍA COMPLETA
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- 9. CHECKLIST LEGAL DE PRE-OPERACIÓN (RF-LEGAL-002)
-- ----------------------------------------------------------------------------
CREATE TABLE legal_checklists (
    id SERIAL PRIMARY KEY,
    checklist_id VARCHAR(50) NOT NULL UNIQUE,
    completed_by INTEGER NOT NULL REFERENCES users(id),
    completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_complete BOOLEAN NOT NULL DEFAULT false,
    certificate_generated BOOLEAN NOT NULL DEFAULT false,
    certificate_path VARCHAR(255)
);

CREATE TABLE legal_checklist_items (
    id SERIAL PRIMARY KEY,
    checklist_id INTEGER NOT NULL REFERENCES legal_checklists(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('normativa', 'documentacion', 'configuracion', 'capacitacion')),
    item_text TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    checked_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_checklist_items_checklist ON legal_checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_category ON legal_checklist_items(category);

-- ----------------------------------------------------------------------------
-- 10. REPORTES MATERIALIZADOS (Optimización para consultas frecuentes)
-- ----------------------------------------------------------------------------
-- Vista materializada para ocupación diaria
CREATE MATERIALIZED VIEW mv_daily_occupancy AS
SELECT
    DATE(entry_time) AS date,
    category,
    COUNT(*) AS total_entries,
    COUNT(CASE WHEN exit_time IS NULL THEN 1 END) AS currently_parked,
    AVG(EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60) AS avg_duration_minutes,
    SUM(final_amount) AS total_revenue
FROM vehicle_transactions
WHERE status = 'completed'
GROUP BY DATE(entry_time), category
WITH DATA;

CREATE UNIQUE INDEX idx_mv_daily_occupancy ON mv_daily_occupancy(date, category);

-- Vista materializada para ingresos por día
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT
    DATE(p.payment_time) AS date,
    p.payment_method,
    vt.category,
    COUNT(*) AS transaction_count,
    SUM(p.amount_paid) AS total_amount,
    AVG(p.amount_paid) AS avg_amount,
    SUM(p.change_amount) AS total_change
FROM payments p
JOIN vehicle_transactions vt ON p.transaction_id = vt.transaction_id
WHERE p.status = 'completed'
GROUP BY DATE(p.payment_time), p.payment_method, vt.category
WITH DATA;

CREATE UNIQUE INDEX idx_mv_daily_revenue ON mv_daily_revenue(date, payment_method, category);

-- ----------------------------------------------------------------------------
-- 11. CONFIGURACIÓN DEL SISTEMA
-- ----------------------------------------------------------------------------
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
    ('parking_capacity', '100', 'Capacidad total de espacios'),
    ('free_minutes', '15', 'Minutos gratis al inicio'),
    ('rounding_policy', 'next_hour', 'Política de redondeo de duración'),
    ('session_timeout_minutes', '30', 'Timeout de sesión de usuario'),
    ('occupancy_alert_90', 'true', 'Alerta al 90% de ocupación'),
    ('occupancy_alert_95', 'true', 'Alerta al 95% de ocupación'),
    ('occupancy_alert_99', 'true', 'Alerta al 99% de ocupación'),
    ('data_retention_years', '2', 'Años de retención de datos'),
    ('custody_terms_version', '1.0', 'Versión actual de términos de custodia');

-- ----------------------------------------------------------------------------
-- 12. SINCRONIZACIÓN Y CONFLICTOS
-- ----------------------------------------------------------------------------
CREATE TABLE sync_conflicts (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    local_record_id INTEGER,
    server_record_id INTEGER,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('duplicate', 'version_mismatch', 'data_conflict')),
    local_data JSONB,
    server_data JSONB,
    resolution VARCHAR(20) CHECK (resolution IN ('local_wins', 'server_wins', 'manual', 'merged')),
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_conflicts_table ON sync_conflicts(table_name);
CREATE INDEX idx_sync_conflicts_resolved ON sync_conflicts(resolution);

-- Log de sincronizaciones
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    records_synced INTEGER NOT NULL DEFAULT 0,
    conflicts_detected INTEGER NOT NULL DEFAULT 0,
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'partial')),
    error_message TEXT
);

CREATE INDEX idx_sync_log_device ON sync_log(device_id);
CREATE INDEX idx_sync_log_status ON sync_log(status);

-- ----------------------------------------------------------------------------
-- TRIGGERS para actualizar updated_at automáticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_structures_updated_at BEFORE UPDATE ON rate_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_transactions_updated_at BEFORE UPDATE ON vehicle_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_spaces_updated_at BEFORE UPDATE ON parking_spaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- FUNCIONES AUXILIARES
-- ----------------------------------------------------------------------------

-- Función para cifrar placas
CREATE OR REPLACE FUNCTION encrypt_plate(plate_text TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(plate_text, current_setting('app.plate_encryption_key', true));
END;
$$ LANGUAGE plpgsql;

-- Función para descifrar placas (solo usuarios autorizados)
CREATE OR REPLACE FUNCTION decrypt_plate(encrypted_plate BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_plate, current_setting('app.plate_encryption_key', true));
END;
$$ LANGUAGE plpgsql;

-- Función para generar ID de transacción único
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    date_part TEXT;
    seq INTEGER;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_id FROM 13) AS INTEGER)), 0) + 1
    INTO seq
    FROM vehicle_transactions
    WHERE transaction_id LIKE 'TXN-' || date_part || '%';
    
    new_id := 'TXN-' || date_part || '-' || LPAD(seq::TEXT, 5, '0');
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Función para generar ID de reclamo único
CREATE OR REPLACE FUNCTION generate_claim_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    date_part TEXT;
    seq INTEGER;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(claim_id FROM 13) AS INTEGER)), 0) + 1
    INTO seq
    FROM claims
    WHERE claim_id LIKE 'CLM-' || date_part || '%';
    
    new_id := 'CLM-' || date_part || '-' || LPAD(seq::TEXT, 5, '0');
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- COMENTARIOS EN TABLAS (Documentación)
-- ----------------------------------------------------------------------------
COMMENT ON TABLE users IS 'Usuarios del sistema: admin, operador, cliente';
COMMENT ON TABLE vehicle_transactions IS 'Transacciones de entrada/salida de vehículos';
COMMENT ON TABLE rates IS 'Tarifas por categoría con vigencia temporal';
COMMENT ON TABLE payments IS 'Registro de pagos procesados';
COMMENT ON TABLE tickets IS 'Tiquetes y recibos emitidos (cumplimiento legal)';
COMMENT ON TABLE claims IS 'Reclamos de clientes por daño, cobro, robo, etc.';
COMMENT ON TABLE audit_logs IS 'Log completo de auditoría de todas las acciones';
COMMENT ON TABLE legal_checklists IS 'Checklist legal de pre-operación';
COMMENT ON TABLE sync_conflicts IS 'Conflictos detectados durante sincronización';
