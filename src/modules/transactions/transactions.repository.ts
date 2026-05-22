import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class TransactionsRepository {
  async findActiveByPlateHash(plateHash: string) {
    return prisma.vehicleTransaction.findFirst({
      where: { plate_hash: plateHash, status: "active" },
    });
  }

  async findActiveByTransactionId(transactionId: string) {
    return prisma.vehicleTransaction.findFirst({
      where: { transaction_id: transactionId, status: "active" },
    });
  }

  async findByTransactionId(transactionId: string) {
    return prisma.vehicleTransaction.findFirst({
      where: { transaction_id: transactionId },
      include: {
        entryOperator: { select: { id: true, username: true, full_name: true } },
        exitOperator: { select: { id: true, username: true, full_name: true } },
        payment: true,
        tickets: true,
      },
    });
  }

  async findByPlateHash(plateHash: string) {
    return prisma.vehicleTransaction.findFirst({
      where: { plate_hash: plateHash },
      include: {
        entryOperator: { select: { id: true, username: true, full_name: true } },
        exitOperator: { select: { id: true, username: true, full_name: true } },
        payment: true,
        tickets: true,
      },
      orderBy: { entry_time: "desc" },
    });
  }

  async findById(id: number) {
    return prisma.vehicleTransaction.findUnique({
      where: { id },
      include: {
        entryOperator: { select: { id: true, username: true, full_name: true } },
        exitOperator: { select: { id: true, username: true, full_name: true } },
        payment: true,
        tickets: true,
      },
    });
  }

  async findActiveTransactions(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.vehicleTransaction.findMany({
        where: { status: "active" },
        include: {
          tickets: true,
        },
        skip,
        take: limit,
        orderBy: { entry_time: "desc" },
      }),
      prisma.vehicleTransaction.count({ where: { status: "active" } }),
    ]);
    return { data, total, page, limit };
  }

  async getMaxSequenceForDate(datePart: string): Promise<number> {
    const result = await prisma.vehicleTransaction.findFirst({
      where: { transaction_id: { startsWith: `TXN-${datePart}` } },
      orderBy: { transaction_id: "desc" },
      select: { transaction_id: true },
    });
    if (!result) return 0;
    const parts = result.transaction_id.split("-");
    const seq = parseInt(parts[parts.length - 1], 10);
    return isNaN(seq) ? 0 : seq;
  }

  async createTransaction(data: {
    transaction_id: string;
    plate_encrypted: Buffer;
    plate_hash: string;
    category: string;
    customer_name: string;
    customer_phone?: string;
    is_international?: boolean;
    country_origin?: string;
    vehicle_description?: string;
    entry_time: Date;
    entry_operator_id?: number;
    space_assigned?: string;
    billing_mode?: string;
    status?: string;
    sync_status?: string;
  }) {
    return prisma.vehicleTransaction.create({ data } as any);
  }

  async assignSpace(transactionId: string) {
    const space = await prisma.parkingSpace.findFirst({
      where: { is_occupied: false },
      orderBy: { space_code: "asc" },
    });
    if (!space) return null;
    return prisma.parkingSpace.update({
      where: { id: space.id },
      data: {
        is_occupied: true,
        current_transaction_id: transactionId,
      },
    });
  }

  async releaseSpace(spaceCode: string) {
    return prisma.parkingSpace.update({
      where: { space_code: spaceCode },
      data: {
        is_occupied: false,
        current_transaction_id: null,
      },
    });
  }

  async createTicket(data: {
    transaction_id: number;
    ticket_type: string;
    ticket_number: string;
    custody_terms_version?: string;
  }) {
    return prisma.ticket.create({ data } as any);
  }

  async updateForExit(
    id: number,
    data: {
      exit_time: Date;
      duration_minutes: number;
      rounded_hours: number;
      billing_mode: string;
      rate_per_hour: number;
      total_amount: number;
      discount_amount?: number;
      final_amount: number;
      exit_operator_id: number;
      status: string;
    }
  ) {
    return prisma.vehicleTransaction.update({
      where: { id },
      data: data as any,
    });
  }

  async findAllTransactions(filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    status?: string;
    plateHash?: string;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, category, status, plateHash, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (startDate || endDate) {
      where.entry_time = {};
      if (startDate) where.entry_time.gte = startDate;
      if (endDate) where.entry_time.lte = endDate;
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (plateHash) where.plate_hash = plateHash;
    const [data, total] = await Promise.all([
      prisma.vehicleTransaction.findMany({
        where,
        include: {
          entryOperator: { select: { id: true, username: true, full_name: true } },
          exitOperator: { select: { id: true, username: true, full_name: true } },
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

  async findActiveSubscription(plateHash: string, date: Date) {
    return prisma.monthlySubscription.findFirst({
      where: {
        plate_hash: plateHash,
        status: "activa",
        start_date: { lte: date },
        end_date: { gte: date },
      },
    });
  }

  async findActivePrepaidCredit(plateHash: string) {
    return prisma.prepaidCredit.findFirst({
      where: {
        plate_hash: plateHash,
        is_active: true,
        balance: { gt: 0 },
      },
    });
  }

  async findActiveRate(category: string) {
    const structure = await prisma.rateStructure.findFirst({
      where: { is_active: true },
      orderBy: { effective_date: "desc" },
    });
    if (!structure) return null;
    return prisma.rate.findFirst({
      where: {
        structure_id: structure.id,
        category: category as any,
        is_active: true,
      },
    });
  }

  async findActiveFractionRate(category: string) {
    const structure = await prisma.rateStructure.findFirst({
      where: { is_active: true },
      orderBy: { effective_date: "desc" },
    });
    if (!structure) return null;
    return prisma.fractionRate.findFirst({
      where: {
        structure_id: structure.id,
        category: category as any,
        is_active: true,
      },
    });
  }

  async getActiveCustodyTermsVersion() {
    const terms = await prisma.custodyTerms.findFirst({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
    });
    return terms?.version ?? null;
  }

  async countAvailableSpaces() {
    return prisma.parkingSpace.count({ where: { is_occupied: false } });
  }
}

export const transactionsRepository = new TransactionsRepository();
