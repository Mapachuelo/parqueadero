import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ClientRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        role: "cliente",
        is_active: true,
      },
    });
  }

  async findTransactionsByPlateHash(
    plateHash: string,
    filters: { page: number; limit: number; from?: Date; to?: Date }
  ) {
    const { page, limit, from, to } = filters;
    const skip = (page - 1) * limit;
    const where: any = { plate_hash: plateHash };
    if (from || to) {
      where.entry_time = {};
      if (from) where.entry_time.gte = from;
      if (to) where.entry_time.lte = to;
    }
    const [data, total] = await Promise.all([
      prisma.vehicleTransaction.findMany({
        where,
        include: {
          payment: true,
          tickets: true,
        },
        skip,
        take: limit,
        orderBy: { entry_time: "desc" },
      }),
      prisma.vehicleTransaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findTransactionById(transactionId: string) {
    return prisma.vehicleTransaction.findFirst({
      where: { transaction_id: transactionId },
      include: {
        payment: true,
        tickets: true,
      },
    });
  }

  async findTransactionByIdAndPlate(transactionId: string, plateHash: string) {
    return prisma.vehicleTransaction.findFirst({
      where: {
        transaction_id: transactionId,
        plate_hash: plateHash,
      },
      include: {
        payment: true,
        tickets: true,
      },
    });
  }

  async findTransactionsByCustomerEmail(
    email: string,
    filters: { page: number; limit: number; from?: Date; to?: Date }
  ) {
    const { page, limit, from, to } = filters;
    const skip = (page - 1) * limit;
    const where: any = { customer_email: email };
    if (from || to) {
      where.entry_time = {};
      if (from) where.entry_time.gte = from;
      if (to) where.entry_time.lte = to;
    }
    const [data, total] = await Promise.all([
      prisma.vehicleTransaction.findMany({
        where,
        include: {
          payment: true,
          tickets: true,
        },
        skip,
        take: limit,
        orderBy: { entry_time: "desc" },
      }),
      prisma.vehicleTransaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findUserEmail(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  async createClientSession(userId: number, token: string, expiresAt: Date) {
    return prisma.userSession.create({
      data: {
        user_id: userId,
        token,
        expires_at: expiresAt,
      },
    });
  }
}

export const clientRepository = new ClientRepository();
