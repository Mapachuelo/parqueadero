import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "../../shared/utils/security.js";

async function createUser(
  prisma: PrismaClient,
  user: { username: string; email: string; fullName: string; role: "admin" | "operador" }
) {
  const existing = await prisma.user.findUnique({ where: { username: user.username } });
  if (existing) {
    return;
  }

  const generatedPassword = randomBytes(12).toString("base64");
  const passwordHash = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      password_hash: passwordHash,
      full_name: user.fullName,
      role: user.role,
      is_active: true,
      must_change_password: true,
    },
  });

  console.log("==============================================");
  console.log(`USUARIO CREADO - credenciales temporales`);
  console.log(`Usuario: ${user.username}`);
  console.log(`Contraseña: ${generatedPassword}`);
  console.log(`El primer acceso forzara el cambio de contraseña.`);
  console.log("Estas credenciales solo se muestran una vez.");
  console.log("==============================================");
}

export async function seedUsers(prisma: PrismaClient) {
  await createUser(prisma, {
    username: "admin",
    email: "admin@parqueadero.com",
    fullName: "Administrador del Sistema",
    role: "admin",
  });

  await createUser(prisma, {
    username: "operador",
    email: "operador@parqueadero.com",
    fullName: "Operador de Parqueadero",
    role: "operador",
  });
}