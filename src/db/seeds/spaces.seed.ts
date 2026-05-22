import { PrismaClient } from "@prisma/client";

export async function seedSpaces(prisma: PrismaClient) {
  const existingCount = await prisma.parkingSpace.count();

  if (existingCount >= 100) return;

  const spaces = [];
  for (let i = 1; i <= 100; i++) {
    const code = `A-${String(i).padStart(3, "0")}`;
    spaces.push({
      space_code: code,
      zone: "General",
      is_occupied: false,
    });
  }

  await prisma.parkingSpace.createMany({
    data: spaces,
    skipDuplicates: true,
  });
}
