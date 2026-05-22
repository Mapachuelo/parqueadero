import { z } from "zod";

export const clientAuthSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  transactionId: z.string().optional(),
  plateLast4: z.string().length(4).optional(),
});

export const clientQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const accessCodeSchema = z.object({
  transactionId: z.string(),
  plateLast4: z.string().length(4),
});
