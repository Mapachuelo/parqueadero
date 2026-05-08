# Estrategia de Sincronización: SQLite ↔ PostgreSQL

## Arquitectura General

```
┌─────────────────────┐          ┌──────────────────────┐
│   Dispositivo POS   │          │     Servidor Cloud   │
│                     │          │                      │
│  ┌───────────────┐  │  HTTPS   │  ┌────────────────┐  │
│  │   Aplicación  │  │ ───────► │  │   API REST     │  │
│  │   (Electron/  │  │  /sync   │  │   (Node.js/    │  │
│  │   Flutter)    │  │ ◄─────── │  │    Python)     │  │
│  └───────┬───────┘  │          │  └───────┬────────┘  │
│          │          │          │          │           │
│  ┌───────▼───────┐  │          │  ┌───────▼────────┐  │
│  │    SQLite     │  │          │  │   PostgreSQL   │  │
│  │  (SQLCipher)  │  │          │  │   (Central)    │  │
│  └───────────────┘  │          │  └────────────────┘  │
└─────────────────────┘          └──────────────────────┘
```

## Flujo de Sincronización

### 1. Modo Offline (sin internet)

```
Operador registra entrada
        │
        ▼
┌──────────────────────────────┐
│ App guarda en SQLite local:  │
│ - vehicle_transactions       │
│ - payments                   │
│ - tickets                    │
│ - audit_logs                 │
│                              │
│ sync_status = 'pending'      │
└──────────────────────────────┘
```

### 2. Detección de Conexión

```python
# La app monitorea conectividad
def check_connectivity():
    try:
        response = requests.get("https://api.parqueadero.com/health", timeout=3)
        return response.status_code == 200
    except:
        return False

# Si hay conexión y hay pendientes, iniciar sync
if check_connectivity() and has_pending_records():
    start_sync()
```

### 3. Proceso de Sincronización

```
┌─────────────────────────────────────────────────────────┐
│ PASO 1: Leer registros pendientes de SQLite             │
│ SELECT * FROM vehicle_transactions WHERE sync_status    │
│        = 'pending' ORDER BY created_at ASC              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ PASO 2: Enviar batch al servidor vía API REST           │
│ POST /api/sync                                          │
│ Body: {                                                 │
│   "device_id": "POS-001",                               │
│   "transactions": [...],                                │
│   "payments": [...],                                    │
│   "tickets": [...],                                     │
│   "audit_logs": [...]                                   │
│ }                                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ PASO 3: Servidor procesa y detecta conflictos           │
│ - Verifica transaction_id duplicados                    │
│ - Verifica plate_hash + entry_time duplicados           │
│ - Si hay conflicto → guarda en sync_conflicts           │
│ - Si no hay conflicto → inserta en PostgreSQL           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ PASO 4: Servidor responde con resultado                 │
│ {                                                       │
│   "status": "completed",                                │
│   "synced": 15,                                         │
│   "conflicts": 1,                                       │
│   "conflict_ids": [123]                                 │
│ }                                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ PASO 5: App actualiza SQLite                            │
│ UPDATE vehicle_transactions                             │
│ SET sync_status = 'synced',                             │
│     server_id = <id_from_server>                        │
│ WHERE id IN (<synced_ids>)                              │
│                                                         │
│ UPDATE vehicle_transactions                             │
│ SET sync_status = 'conflict'                            │
│ WHERE id IN (<conflict_ids>)                            │
└─────────────────────────────────────────────────────────┘
```

## Resolución de Conflictos (RF-OFFLINE-002)

### Escenario de Conflicto

```
Dispositivo A (offline)          Dispositivo B (online)
      │                                │
      ▼                                ▼
Registra entrada placa ABC-123   Registra entrada placa ABC-123
TXN-20260508-00001               TXN-20260508-00002
10:00:00 AM                      10:00:05 AM
      │                                │
      │         Sincroniza             │
      └─────────────┬──────────────────┘
                    ▼
        ┌───────────────────────┐
        │ Servidor detecta:     │
        │ Mismo plate_hash      │
        │ Timestamps cercanos   │
        │ Status = 'active'     │
        │                       │
        │ CONFLICTO DETECTADO   │
        └───────────────────────┘
```

### Reglas de Resolución

| Tipo de Conflicto | Regla | Acción |
|---|---|---|
| Mismo `transaction_id` | Server wins | Descarta registro local |
| Mismo `plate_hash` + `entry_time` (±5 min) + status `active` | Manual | Guarda en `sync_conflicts`, alerta a Admin |
| Mismo `plate_hash` pero uno tiene `exit_time` | Server wins | El que tiene salida es válido |
| Datos diferentes para mismo `server_id` | Manual | Admin decide cuál preservar |

## Estructura de la API REST

### Endpoints de Sincronización

```
POST   /api/sync                    # Enviar registros pendientes
GET    /api/sync/status             # Ver estado de última sync
GET    /api/sync/conflicts          # Listar conflictos pendientes
POST   /api/sync/conflicts/:id/resolve  # Resolver conflicto manual
GET    /api/sync/rates              # Descargar tarifas actualizadas
GET    /api/sync/users              # Descargar usuarios actualizados
```

### Payload de Sincronización

```json
{
  "device_id": "POS-001",
  "last_sync_timestamp": "2026-05-08T10:00:00Z",
  "transactions": [
    {
      "local_id": 1,
      "transaction_id": "TXN-20260508-00001",
      "plate_hash": "a1b2c3d4...",
      "category": "A",
      "entry_time": "2026-05-08T10:00:00Z",
      "exit_time": "2026-05-08T12:30:00Z",
      "duration_minutes": 150,
      "rounded_hours": 3,
      "rate_applied": 5000,
      "total_amount": 15000,
      "final_amount": 15000,
      "status": "completed",
      "operator_id": 1
    }
  ],
  "payments": [
    {
      "local_id": 1,
      "transaction_id": "TXN-20260508-00001",
      "payment_method": "efectivo",
      "amount_paid": 15000,
      "change_amount": 0,
      "payment_time": "2026-05-08T12:30:00Z",
      "operator_id": 1
    }
  ]
}
```

## Configuración de SQLCipher (Cifrado SQLite)

```bash
# Instalar SQLCipher
# Ubuntu/Debian
sudo apt-get install libsqlcipher-dev

# Python
pip install pysqlcipher3

# Node.js
npm install better-sqlite3  # Con SQLCipher compilado
```

```python
# Ejemplo Python con SQLCipher
from pysqlcipher3 import dbapi2 as sqlite

conn = sqlite.connect('parqueadero.db')
conn.execute("PRAGMA key = 'clave-segura-del-dispositivo'")
conn.execute("PRAGMA cipher_page_size = 4096")
conn.execute("PRAGMA kdf_iter = 256000")
```

## Monitoreo de Sincronización

```sql
-- En PostgreSQL: Ver conflictos pendientes
SELECT sc.id, sc.table_name, sc.conflict_type, sc.created_at
FROM sync_conflicts sc
WHERE sc.resolution IS NULL
ORDER BY sc.created_at DESC;

-- Ver dispositivos y última sincronización
SELECT sl.device_id, sl.sync_completed_at, sl.records_synced, sl.status
FROM sync_log sl
WHERE sl.sync_completed_at = (
    SELECT MAX(sync_completed_at) FROM sync_log WHERE device_id = sl.device_id
);
```

## Consideraciones de Seguridad

1. **HTTPS obligatorio** para toda comunicación
2. **API Key o JWT** para autenticar dispositivos
3. **Rate limiting** en endpoints de sync
4. **SQLCipher** para cifrar base de datos local
5. **pgcrypto** para cifrar placas en PostgreSQL
6. **Log de auditoría** de todas las sincronizaciones
7. **Validación de datos** en servidor antes de insertar
