import { format } from "date-fns";

export function generateTransactionId(seq: number): string {
  const datePart = format(new Date(), "yyyyMMdd");
  return `TXN-${datePart}-${String(seq).padStart(5, "0")}`;
}

export function generateClaimId(seq: number): string {
  const datePart = format(new Date(), "yyyyMMdd");
  return `CLM-${datePart}-${String(seq).padStart(5, "0")}`;
}

export function generateSubscriptionId(seq: number): string {
  const datePart = format(new Date(), "yyyyMM");
  return `SUB-${datePart}-${String(seq).padStart(5, "0")}`;
}

export function generateCreditId(seq: number): string {
  const datePart = format(new Date(), "yyyyMMdd");
  return `CRD-${datePart}-${String(seq).padStart(5, "0")}`;
}

export function generateTicketNumber(): string {
  const datePart = format(new Date(), "yyyyMMdd");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${datePart}-${random}`;
}
