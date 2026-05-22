import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SQLITE_PATH: z.string().default("./data/local.db"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION_MINUTES: z.coerce.number().default(30),
  PLATE_ENCRYPTION_KEY: z.string().min(64),
  SYNC_API_KEY: z.string().min(16),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("Parqueadero Neiva <parqueadero@email.com>"),
  UPLOAD_DIR: z.string().default("./uploads"),
  BACKUP_DIR: z.string().default("./backups"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Error de configuracion de variables de entorno:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
