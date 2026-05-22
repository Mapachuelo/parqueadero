import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./users.seed.js";
import { seedRates } from "./rates.seed.js";
import { seedSpaces } from "./spaces.seed.js";
import { seedConfig } from "./config.seed.js";
import { seedLegal } from "./legal.seed.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de base de datos...");

  await seedUsers(prisma);
  console.log("Usuarios creados.");

  await seedRates(prisma);
  console.log("Tarifas creadas.");

  await seedSpaces(prisma);
  console.log("Espacios creados.");

  await seedConfig(prisma);
  console.log("Configuracion del sistema creada.");

  await seedLegal(prisma);
  console.log("Terminos de custodia creados.");

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
