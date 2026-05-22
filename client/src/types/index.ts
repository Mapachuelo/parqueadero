export const Role = {
  admin: "admin",
  operador: "operador",
  cliente: "cliente",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Category = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const CategoryLabel: Record<Category, string> = {
  A: "Liviano (A)",
  B: "Medio (B)",
  C: "Pesado (C)",
  D: "Motocicleta (D)",
};

export const PaymentMethod = {
  efectivo: "efectivo",
  tarjeta_credito: "tarjeta_credito",
  tarjeta_debito: "tarjeta_debito",
  transferencia: "transferencia",
  billetera_digital: "billetera_digital",
  abono: "abono",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta_credito: "Tarjeta de Crédito",
  tarjeta_debito: "Tarjeta de Débito",
  transferencia: "Transferencia",
  billetera_digital: "Billetera Digital",
  abono: "Abono",
};

export const TransactionStatus = {
  active: "active",
  completed: "completed",
  cancelled: "cancelled",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const ClaimStatus = {
  abierto: "abierto",
  en_investigacion: "en_investigacion",
  resuelto: "resuelto",
  rechazado: "rechazado",
  vencido: "vencido",
} as const;
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const ClaimCategory = {
  danio: "danio",
  cobro_incorrecto: "cobro_incorrecto",
  robo_hurto: "robo_hurto",
  perdida: "perdida",
  otro: "otro",
} as const;
export type ClaimCategory = (typeof ClaimCategory)[keyof typeof ClaimCategory];

export const ClaimCategoryLabel: Record<ClaimCategory, string> = {
  danio: "Daño",
  cobro_incorrecto: "Cobro Incorrecto",
  robo_hurto: "Robo/Hurto",
  perdida: "Pérdida",
  otro: "Otro",
};

export const ClaimStatusLabel: Record<ClaimStatus, string> = {
  abierto: "Abierto",
  en_investigacion: "En Investigación",
  resuelto: "Resuelto",
  rechazado: "Rechazado",
  vencido: "Vencido",
};

export interface User {
  id: number;
  username: string;
  role: Role;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VehicleTransaction {
  id: number;
  transaction_id: string;
  plate_hash?: string;
  plate?: string;
  category: Category;
  customer_name: string;
  customer_phone?: string;
  entry_time: string;
  exit_time?: string;
  duration?: number;
  status: TransactionStatus;
  space_assigned?: string;
  billing_mode?: string;
  total_amount?: number;
  final_amount?: number;
  operator?: { id: number; full_name: string };
  payment?: Payment;
  ticket?: Ticket;
}

export interface Payment {
  id: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount?: number;
  prepaid_used?: number;
  status: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_type: string;
  ticket_content?: string;
  ticket_number?: string;
}

export interface Rate {
  id: number;
  category: Category;
  price_per_hour: number;
  description?: string;
  valid_from?: string;
  valid_to?: string;
}

export interface RateStructure {
  id: number;
  name: string;
  description?: string;
  effective_date?: string;
  is_active: boolean;
  rates?: Rate[];
  fraction_rates?: FractionRate[];
}

export interface FractionRate {
  id: number;
  category: Category;
  minutes15: number;
  minutes30: number;
  minutes45: number;
}

export interface Subscription {
  id: number;
  plate_hash: string;
  plate?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  monthly_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
}

export interface PrepaidCredit {
  id: number;
  plate_hash: string;
  plate?: string;
  customer_name: string;
  customer_phone?: string;
  amount: number;
  balance: number;
  is_hours: boolean;
  status: string;
  expiration_date?: string;
}

export interface Claim {
  id: number;
  claim_id: string;
  transaction_id?: string;
  category: ClaimCategory;
  status: ClaimStatus;
  description: string;
  resolution?: string;
  compensation_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface ClaimEvidence {
  id: number;
  file_path: string;
  description?: string;
}

export interface ClaimNote {
  id: number;
  content: string;
  created_at: string;
  user?: { id: number; full_name: string };
}

export interface CustodyTerms {
  id: number;
  version: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface LegalChecklist {
  id: number;
  name: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  items: LegalChecklistItem[];
}

export interface LegalChecklistItem {
  id: number;
  category: string;
  description: string;
  is_checked: boolean;
  checked_at?: string;
}

export interface ParkingSpace {
  code: string;
  is_occupied: boolean;
  current_transaction_id?: string;
  plate?: string;
}

export interface OccupancyReport {
  date: string;
  total_spaces: number;
  occupied: number;
  free: number;
  percentage: number;
  hourly?: { hour: number; occupied: number }[];
}

export interface RevenueReport {
  period: string;
  total: number;
  by_category: { category: Category; count: number; total: number }[];
  by_payment: { method: PaymentMethod; count: number; total: number }[];
  discounts: number;
  net: number;
}

export interface ComplianceReport {
  ticket_emission_rate: number;
  receipt_emission_rate: number;
  custody_terms_rate: number;
  data_accesses: number;
  data_deletions: number;
  open_claims: number;
  resolved_on_time: number;
  overdue_claims: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
