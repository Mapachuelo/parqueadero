import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

if (process.env.NODE_ENV === "test") {
  process.env.DATABASE_URL ||= "postgresql://test@localhost:5432/test";
  process.env.JWT_SECRET ||= "test-dummy-jwt-secret-at-least-32-characters-long-ok";
  process.env.PLATE_ENCRYPTION_KEY ||= "d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0";
  process.env.SYNC_API_KEY ||= "test-dummy-sync-api-key-16ch";
}

const noPlaceholder = (value: string) =>
  !value.includes("CAMBIAR_POR_") && !value.includes("cambiar-por-") && !value.includes("CHANGE_ME");

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(noPlaceholder, "DATABASE_URL contiene un valor placeholder, configure claves reales"),
  SQLITE_PATH: z.string().default("./data/local.db"),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine(noPlaceholder, "JWT_SECRET contiene un valor placeholder, configure una clave real"),
  JWT_EXPIRATION_MINUTES: z.coerce.number().default(30),
  PLATE_ENCRYPTION_KEY: z
    .string()
    .min(64)
    .refine(noPlaceholder, "PLATE_ENCRYPTION_KEY contiene un valor placeholder, configure una clave real"),
  SYNC_API_KEY: z
    .string()
    .min(16)
    .refine(noPlaceholder, "SYNC_API_KEY contiene un valor placeholder, configure una clave real"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"] as const).default("development"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("Parqueadero Neiva <parqueadero@email.com>"),
  UPLOAD_DIR: z.string().default("./uploads"),
  BACKUP_DIR: z.string().default("./backups"),
  SERVE_STATIC: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Error de configuracion de variables de entorno:");
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;