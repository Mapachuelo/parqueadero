import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: Date, pattern = "dd 'de' MMM 'de' yyyy HH:mm"): string {
  return format(date, pattern, { locale: es });
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx", { locale: es });
}

export function roundDuration(durationMinutes: number, freeMinutes = 15): number {
  if (durationMinutes <= freeMinutes) return 0;
  return Math.ceil(durationMinutes / 60);
}

export function calculateDurationMinutes(entryTime: Date, exitTime: Date): number {
  return differenceInMinutes(exitTime, entryTime);
}

export function isWithinRange(date: Date, from?: Date, to?: Date): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function todayRange(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}
