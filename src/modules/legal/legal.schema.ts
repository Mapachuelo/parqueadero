import { z } from "zod";

export const custodyTermsSchema = z.object({
  version: z.string().min(1),
  content: z.string().min(10),
});

export const checklistCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const checklistItemSchema = z.object({
  isChecked: z.boolean(),
});
