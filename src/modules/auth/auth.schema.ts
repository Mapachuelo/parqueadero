import { z } from "zod";
import { Role } from "../../shared/types/enums.js";

export const loginSchema = z.object({
  username: z.string(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum([Role.ADMIN, Role.OPERADOR] as const),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
