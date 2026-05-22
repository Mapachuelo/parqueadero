export enum Role {
  ADMIN = "admin",
  OPERADOR = "operador",
  CLIENTE = "cliente",
}

export enum Category {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
}

export enum BillingMode {
  HORA = "hora",
  FRACCION = "fraccion",
  MENSUALIDAD = "mensualidad",
  ABONO = "abono",
  MIXTO = "mixto",
}

export enum PaymentMethod {
  EFECTIVO = "efectivo",
  TARJETA_CREDITO = "tarjeta_credito",
  TARJETA_DEBITO = "tarjeta_debito",
  TRANSFERENCIA = "transferencia",
  BILLETERA_DIGITAL = "billetera_digital",
  ABONO = "abono",
}

export enum TransactionStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REFUNDED = "refunded",
  FAILED = "failed",
}

export enum ClaimStatus {
  ABIERTO = "abierto",
  EN_INVESTIGACION = "en_investigacion",
  RESUELTO = "resuelto",
  RECHAZADO = "rechazado",
  VENCIDO = "vencido",
}

export enum ClaimCategory {
  DANIO = "danio",
  COBRO_INCORRECTO = "cobro_incorrecto",
  ROBO_HURTO = "robo_hurto",
  PERDIDA = "perdida",
  OTRO = "otro",
}

export enum SyncStatus {
  PENDING = "pending",
  SYNCED = "synced",
  CONFLICT = "conflict",
}

export enum ConflictType {
  DUPLICATE = "duplicate",
  VERSION_MISMATCH = "version_mismatch",
  DATA_CONFLICT = "data_conflict",
}

export enum ConflictResolution {
  LOCAL_WINS = "local_wins",
  SERVER_WINS = "server_wins",
  MANUAL = "manual",
  MERGED = "merged",
}
