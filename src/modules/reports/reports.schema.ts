import { z } from "zod";

const dateOrDateOnly = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha invalido, use YYYY-MM-DD"),
]);

function toRange(value: string | undefined, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`).toISOString();
  }
  return value;
}

export const dateRangeSchema = z
  .object({
    from: dateOrDateOnly.optional(),
    to: dateOrDateOnly.optional(),
  })
  .transform((v) => ({
    from: toRange(v.from, false),
    to: toRange(v.to, true),
  }));

export const reportFiltersSchema = z
  .object({
    from: dateOrDateOnly.optional(),
    to: dateOrDateOnly.optional(),
    category: z.enum(["A", "B", "C", "D"] as const).optional(),
    paymentMethod: z.string().optional(),
    operatorId: z.coerce.number().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
  })
  .transform((v) => ({
    ...v,
    from: toRange(v.from, false),
    to: toRange(v.to, true),
  }));

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;