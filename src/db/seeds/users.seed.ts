import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const operadorPasswordHash = await bcrypt.hash("Operador123!", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@parqueadero.com",
      password_hash: adminPasswordHash,
      full_name: "Administrador del Sistema",
      role: "admin",
      is_active: true,
      must_change_password: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "operador" },
    update: {},
    create: {
      username: "operador",
      email: "operador@parqueadero.com",
      password_hash: operadorPasswordHash,
      full_name: "Operador de Parqueadero",
      role: "operador",
      is_active: true,
    },
  });
}
