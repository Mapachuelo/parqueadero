import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class SyncRepository {
  async findTransactionByTransactionId(transactionId: string) {
    return prisma.vehicleTransaction.findUnique({
      where: { transaction_id: transactionId },
    });
  }

  async findActiveTransactionByPlateHash(plateHash: string) {
    return prisma.vehicleTransaction.findFirst({
      where: { plate_hash: plateHash, status: "active" },
    });
  }

  async findTransactionByPlateHashAndTime(
    plateHash: string,
    entryTime: Date,
    windowMinutes: number
  ) {
    const lower = new Date(entryTime.getTime() - windowMinutes * 60 * 1000);
    const upper = new Date(entryTime.getTime() + windowMinutes * 60 * 1000);

    return prisma.vehicleTransaction.findFirst({
      where: {
        plate_hash: plateHash,
        status: "active",
        entry_time: { gte: lower, lte: upper },
      },
    });
  }

  async createTransaction(data: {
    transaction_id: string;
    plate_encrypted: Buffer;
    plate_hash: string;
    category: string;
    customer_name: string;
    customer_phone?: string;
    entry_time: Date;
    exit_time?: Date;
    billing_mode?: string;
    total_amount?: number;
    final_amount?: number;
    status: string;
    space_assigned?: string;
    entry_operator_id?: number;
    exit_operator_id?: number;
    sync_status?: string;
  }) {
    return prisma.vehicleTransaction.create({ data } as any);
  }

  async updateTransactionByTransactionId(
    transactionId: string,
    data: Record<string, any>
  ) {
    return prisma.vehicleTransaction.update({
      where: { transaction_id: transactionId },
      data: data as any,
    });
  }

  async findPaymentByVehicleTxnId(vehicleTxnId: number) {
    return prisma.payment.findUnique({
      where: { transaction_id: vehicleTxnId },
    });
  }

  async createPayment(data: {
    transaction_id: number;
    payment_method: string;
    amount_paid: number;
    change_amount?: number;
    status: string;
    operator_id?: number;
  }) {
    return prisma.payment.create({ data } as any);
  }

  async createSyncLog(data: {
    device_id: string;
    synced_count: number;
    conflict_count: number;
    status: string;
    message?: string;
  }) {
    return prisma.syncLog.create({ data });
  }

  async findAllConflicts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.syncConflict.findMany({
        where: { resolution: null },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.syncConflict.count({ where: { resolution: null } }),
    ]);
    return { data, total, page, limit };
  }

  async findConflictById(id: number) {
    return prisma.syncConflict.findUnique({ where: { id } });
  }

  async createConflict(data: {
    table_name: string;
    local_record_id: string;
    server_record_id?: string;
    conflict_type: string;
    local_data: any;
    server_data?: any;
  }) {
    return prisma.syncConflict.create({
      data: {
        table_name: data.table_name,
        local_record_id: data.local_record_id,
        server_record_id: data.server_record_id,
        conflict_type: data.conflict_type as any,
        local_data: data.local_data,
        server_data: data.server_data ?? null,
      },
    });
  }

  async resolveConflict(
    id: number,
    resolution: string,
    resolvedBy: number
  ) {
    return prisma.syncConflict.update({
      where: { id },
      data: {
        resolution: resolution as any,
        resolved_by: resolvedBy,
        resolved_at: new Date(),
      },
    });
  }

  async getActiveRates() {
    const structure = await prisma.rateStructure.findFirst({
      where: { is_active: true },
      orderBy: { effective_date: "desc" },
    });
    if (!structure) return { structure: null, rates: [], fractionRates: [] };

    const [rates, fractionRates] = await Promise.all([
      prisma.rate.findMany({
        where: { structure_id: structure.id, is_active: true },
      }),
      prisma.fractionRate.findMany({
        where: { structure_id: structure.id, is_active: true },
      }),
    ]);

    return { structure, rates, fractionRates };
  }

  async getActiveSubscriptions() {
    return prisma.monthlySubscription.findMany({
      where: { status: "activa" },
      orderBy: { start_date: "desc" },
    });
  }

  async getActiveCredits() {
    return prisma.prepaidCredit.findMany({
      where: {
        is_active: true,
        balance: { gt: 0 },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getUsers() {
    return prisma.user.findMany({
      where: { is_active: true },
      select: { id: true, username: true, full_name: true, role: true },
      orderBy: { username: "asc" },
    });
  }

  async getLastSyncLog(deviceId: string) {
    return prisma.syncLog.findFirst({
      where: { device_id: deviceId },
      orderBy: { created_at: "desc" },
    });
  }

  async getAllSyncLogs(limit: number = 20) {
    return prisma.syncLog.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }
}

export const syncRepository = new SyncRepository();
