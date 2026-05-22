import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class SpacesRepository {
  async findAllSpaces() {
    return prisma.parkingSpace.findMany({
      orderBy: { space_code: "asc" },
    });
  }

  async findSpaceByCode(code: string) {
    return prisma.parkingSpace.findUnique({
      where: { space_code: code },
    });
  }

  async getOccupancySummary() {
    const total = await prisma.parkingSpace.count();
    const occupied = await prisma.parkingSpace.count({
      where: { is_occupied: true },
    });

    return {
      total,
      occupied,
      free: total - occupied,
      pct: total > 0 ? (occupied / total) * 100 : 0,
    };
  }

  async releaseSpace(code: string) {
    return prisma.parkingSpace.update({
      where: { space_code: code },
      data: {
        is_occupied: false,
        current_transaction_id: null,
      },
    });
  }

  async getActiveTransactionForSpace(code: string) {
    const space = await prisma.parkingSpace.findUnique({
      where: { space_code: code },
    });

    if (!space || !space.current_transaction_id) return null;

    return prisma.vehicleTransaction.findFirst({
      where: {
        transaction_id: space.current_transaction_id,
        status: "active",
      },
    });
  }

  async cancelTransaction(transactionId: number) {
    return prisma.vehicleTransaction.update({
      where: { id: transactionId },
      data: { status: "cancelled" },
    });
  }
}

export const spacesRepository = new SpacesRepository();
