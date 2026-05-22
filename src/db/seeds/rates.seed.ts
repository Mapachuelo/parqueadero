import { PrismaClient } from "@prisma/client";

export async function seedRates(prisma: PrismaClient) {
  const structure = await prisma.rateStructure.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Estructura Base v1.0",
      is_active: true,
      effective_date: new Date(),
    },
  });

  const rateCategories = [
    { category: "A" as const, price: 5000 },
    { category: "B" as const, price: 8000 },
    { category: "C" as const, price: 12000 },
    { category: "D" as const, price: 3000 },
  ];

  for (const { category, price } of rateCategories) {
    const existing = await prisma.rate.findFirst({
      where: {
        structure_id: structure.id,
        category,
      },
    });

    if (!existing) {
      await prisma.rate.create({
        data: {
          structure_id: structure.id,
          category,
          price_per_hour: price,
          is_active: true,
        },
      });
    }
  }
}
