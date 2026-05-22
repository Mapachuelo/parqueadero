import { z } from "zod";

export const entrySchema = z.object({
  plate: z.string().min(3).max(15).transform(v => v.toUpperCase()),
  category: z.enum(["A", "B", "C", "D"] as const),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().max(20).optional(),
  isInternational: z.boolean().optional().default(false),
  countryOrigin: z.string().max(50).optional(),
  vehicleDescription: z.string().max(200).optional(),
});

export type EntryInput = z.infer<typeof entrySchema>;

export const exitSchema = z.object({
  transactionId: z.string().optional(),
  plate: z.string().optional(),
});

export type ExitInput = z.infer<typeof exitSchema>;

export const activeQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

export type ActiveQuery = z.infer<typeof activeQuerySchema>;
