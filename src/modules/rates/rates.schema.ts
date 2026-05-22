import { z } from "zod";

export const rateStructureSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  effectiveDate: z.string().datetime().optional(),
});

export const rateSchema = z.object({
  structureId: z.coerce.number(),
  category: z.enum(["A", "B", "C", "D"] as const),
  pricePerHour: z.coerce.number().min(0),
  description: z.string().max(255).optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

export const fractionRateSchema = z.object({
  structureId: z.coerce.number(),
  category: z.enum(["A", "B", "C", "D"] as const),
  minutes15: z.coerce.number().min(0),
  minutes30: z.coerce.number().min(0),
  minutes45: z.coerce.number().min(0),
});

export const subscriptionSchema = z.object({
  plate: z.string().min(3).max(15).transform(v => v.toUpperCase()),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().max(20).optional(),
  customerEmail: z.string().email().optional(),
  monthlyAmount: z.coerce.number().min(0),
  startDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional().default(false),
  durationMonths: z.coerce.number().min(1).default(1),
});

export const creditSchema = z.object({
  plate: z.string().min(3).max(15).transform(v => v.toUpperCase()),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().max(20).optional(),
  amount: z.coerce.number().min(0),
  isHours: z.boolean().optional().default(false),
  expirationDate: z.string().datetime().optional(),
});

export const rechargeSchema = z.object({
  amount: z.coerce.number().min(0),
});
