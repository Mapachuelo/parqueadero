import { z } from "zod";

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const reportFiltersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: z.enum(["A", "B", "C", "D"] as const).optional(),
  paymentMethod: z.string().optional(),
  operatorId: z.coerce.number().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
