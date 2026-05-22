import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/, "Debe contener al menos una mayuscula").regex(/[a-z]/, "Debe contener al menos una minuscula").regex(/[0-9]/, "Debe contener al menos un numero").regex(/[^A-Za-z0-9]/, "Debe contener al menos un simbolo"),
});

export const notificationPreferencesSchema = z.object({
  rateChanges: z.boolean().optional(),
  occupancyAlerts: z.boolean().optional(),
  systemErrors: z.boolean().optional(),
  syncFailures: z.boolean().optional(),
  claims: z.boolean().optional(),
  unauthorizedAccess: z.boolean().optional(),
  dailySummary: z.boolean().optional(),
  printerOffline: z.boolean().optional(),
  paymentFailures: z.boolean().optional(),
  sessionExpiring: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
});
