import { z } from "zod";

export const custodyTermsSchema = z.object({
  version: z.string().min(1).max(20),
  content: z.string().min(10),
});

export const checklistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

export const checklistItemSchema = z.object({
  category: z.enum(["normativa", "documentacion", "configuracion", "capacitacion"] as const),
  description: z.string().min(1).max(500),
});

export const checklistItemUpdateSchema = z.object({
  isChecked: z.boolean(),
});
