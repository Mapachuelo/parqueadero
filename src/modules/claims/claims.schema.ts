import { z } from "zod";

export const createClaimSchema = z.object({
  transactionId: z.string().optional(),
  category: z.enum(["danio", "cobro_incorrecto", "robo_hurto", "perdida", "otro"] as const),
  description: z.string().min(10).max(2000),
});

export const updateClaimSchema = z.object({
  status: z.enum(["abierto", "en_investigacion", "resuelto", "rechazado", "vencido"] as const).optional(),
  assignedTo: z.coerce.number().optional(),
  resolution: z.string().max(2000).optional(),
  compensationAmount: z.coerce.number().min(0).optional(),
});

export const claimNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const claimEvidenceSchema = z.object({
  filePath: z.string().min(1),
  description: z.string().max(500).optional(),
});
