import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class RatesRepository {
  async createRateStructure(data: { name: string; description?: string; effectiveDate?: Date }) {
    return prisma.rateStructure.create({
      data: {
        name: data.name,
        description: data.description,
        effective_date: data.effectiveDate,
      },
      include: { rates: true, fractionRates: true },
    });
  }

  async findAllRateStructures() {
    return prisma.rateStructure.findMany({
      include: { rates: true, fractionRates: true },
      orderBy: { created_at: "desc" },
    });
  }

  async findRateStructureById(id: number) {
    return prisma.rateStructure.findUnique({
      where: { id },
      include: { rates: true, fractionRates: true },
    });
  }

  async updateRateStructure(id: number, data: { name?: string; description?: string }) {
    return prisma.rateStructure.update({
      where: { id },
      data,
    });
  }

  async activateStructure(id: number, effectiveDate: Date) {
    await prisma.rateStructure.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    return prisma.rateStructure.update({
      where: { id },
      data: { is_active: true, effective_date: effectiveDate },
      include: { rates: true, fractionRates: true },
    });
  }

  async createRate(data: {
    structureId: number;
    category: string;
    pricePerHour: number;
    description?: string;
    validFrom?: Date;
    validTo?: Date;
  }) {
    return prisma.rate.create({
      data: {
        structure_id: data.structureId,
        category: data.category as any,
        price_per_hour: data.pricePerHour,
        description: data.description,
        valid_from: data.validFrom,
        valid_to: data.validTo,
      },
    });
  }

  async findActiveRateByCategory(category: string) {
    return prisma.rate.findFirst({
      where: {
        category: category as any,
        is_active: true,
        structure: { is_active: true },
      },
      include: { structure: true },
      orderBy: { created_at: "desc" },
    });
  }

  async findActiveFractionRateByCategory(category: string) {
    return prisma.fractionRate.findFirst({
      where: {
        category: category as any,
        is_active: true,
        structure: { is_active: true },
      },
      include: { structure: true },
      orderBy: { created_at: "desc" },
    });
  }

  async createFractionRate(data: {
    structureId: number;
    category: string;
    minutes15: number;
    minutes30: number;
    minutes45: number;
  }) {
    const existing = await prisma.fractionRate.findFirst({
      where: { structure_id: data.structureId, category: data.category as any },
    });

    if (existing) {
      return prisma.fractionRate.update({
        where: { id: existing.id },
        data: {
          minutes_15: data.minutes15,
          minutes_30: data.minutes30,
          minutes_45: data.minutes45,
          is_active: true,
        },
      });
    }

    return prisma.fractionRate.create({
      data: {
        structure_id: data.structureId,
        category: data.category as any,
        minutes_15: data.minutes15,
        minutes_30: data.minutes30,
        minutes_45: data.minutes45,
      },
    });
  }

  async findAllFractionRates() {
    return prisma.fractionRate.findMany({
      include: { structure: true },
      orderBy: { created_at: "desc" },
    });
  }

  async findActiveRates() {
    return prisma.rate.findMany({
      where: {
        is_active: true,
        structure: { is_active: true },
      },
      include: { structure: true },
    });
  }

  async findRateHistory(rateId: number) {
    return prisma.rateChangeHistory.findMany({
      where: { rate_id: rateId },
      orderBy: { changed_at: "desc" },
    });
  }

  async createRateChangeHistory(data: {
    rateId: number;
    oldPrice: number;
    newPrice: number;
    changedBy?: number;
    changeReason?: string;
  }) {
    return prisma.rateChangeHistory.create({
      data: {
        rate_id: data.rateId,
        old_price: data.oldPrice,
        new_price: data.newPrice,
        changed_by: data.changedBy,
        change_reason: data.changeReason,
      },
    });
  }

  async createSubscription(data: {
    subscriptionId: string;
    plateEncrypted: Uint8Array;
    plateHash: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    monthlyAmount: number;
    startDate: Date;
    endDate: Date;
    autoRenew?: boolean;
    registeredBy?: number;
  }) {
    return prisma.monthlySubscription.create({
      data: {
        subscription_id: data.subscriptionId,
        plate_encrypted: data.plateEncrypted as any,
        plate_hash: data.plateHash,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        monthly_amount: data.monthlyAmount,
        start_date: data.startDate,
        end_date: data.endDate,
        auto_renew: data.autoRenew,
        registered_by: data.registeredBy,
      },
    });
  }

  async findActiveSubscriptionByPlateHash(plateHash: string, date: Date) {
    return prisma.monthlySubscription.findFirst({
      where: {
        plate_hash: plateHash,
        status: "activa",
        start_date: { lte: date },
        end_date: { gte: date },
      },
      orderBy: { end_date: "desc" },
    });
  }

  async findAllSubscriptions(filters: {
    status?: string;
    plateHash?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.plateHash) where.plate_hash = filters.plateHash;
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [data, total] = await Promise.all([
      prisma.monthlySubscription.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.monthlySubscription.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findSubscriptionById(id: number) {
    return prisma.monthlySubscription.findUnique({ where: { id } });
  }

  async findSubscriptionBySubscriptionId(subId: string) {
    return prisma.monthlySubscription.findUnique({ where: { subscription_id: subId } });
  }

  async updateSubscription(id: number, data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    monthlyAmount?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    autoRenew?: boolean;
  }) {
    return prisma.monthlySubscription.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined && { customer_name: data.customerName }),
        ...(data.customerPhone !== undefined && { customer_phone: data.customerPhone }),
        ...(data.customerEmail !== undefined && { customer_email: data.customerEmail }),
        ...(data.monthlyAmount !== undefined && { monthly_amount: data.monthlyAmount }),
        ...(data.startDate !== undefined && { start_date: data.startDate }),
        ...(data.endDate !== undefined && { end_date: data.endDate }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.autoRenew !== undefined && { auto_renew: data.autoRenew }),
      },
    });
  }

  async createCredit(data: {
    creditId: string;
    plateHash: string;
    customerName: string;
    customerPhone?: string;
    balance: number;
    originalAmount: number;
    isHours?: boolean;
    expirationDate?: Date;
    purchasedBy?: number;
  }) {
    return prisma.prepaidCredit.create({
      data: {
        credit_id: data.creditId,
        plate_hash: data.plateHash,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        balance: data.balance,
        original_amount: data.originalAmount,
        is_hours: data.isHours,
        expiration_date: data.expirationDate,
        purchased_by: data.purchasedBy,
      },
    });
  }

  async findActiveCreditByPlateHash(plateHash: string) {
    return prisma.prepaidCredit.findFirst({
      where: {
        plate_hash: plateHash,
        balance: { gt: 0 },
        is_active: true,
        OR: [
          { expiration_date: null },
          { expiration_date: { gte: new Date() } },
        ],
      },
      orderBy: { balance: "desc" },
    });
  }

  async findCreditById(id: number) {
    return prisma.prepaidCredit.findUnique({
      where: { id },
      include: { movements: { orderBy: { created_at: "desc" } } },
    });
  }

  async findAllCredits(filters: {
    status?: string;
    plateHash?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.plateHash) where.plate_hash = filters.plateHash;
    if (filters.status === "active") {
      where.is_active = true;
      where.balance = { gt: 0 };
    } else if (filters.status === "expired") {
      where.is_active = true;
      where.balance = { gt: 0 };
      where.expiration_date = { lt: new Date() };
    } else if (filters.status === "depleted") {
      where.balance = { lte: 0 };
    }
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [data, total] = await Promise.all([
      prisma.prepaidCredit.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { movements: { orderBy: { created_at: "desc" }, take: 1 } },
      }),
      prisma.prepaidCredit.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async rechargeCredit(id: number, amount: number) {
    const credit = await prisma.prepaidCredit.findUnique({ where: { id } });
    if (!credit) return null;

    const newBalance = Number(credit.balance) + amount;

    const [updated] = await Promise.all([
      prisma.prepaidCredit.update({
        where: { id },
        data: { balance: newBalance },
      }),
      prisma.prepaidMovement.create({
        data: {
          credit_id: id,
          type: "credit",
          amount,
          balance_after: newBalance,
        },
      }),
    ]);

    return updated;
  }

  async deductCredit(id: number, amount: number) {
    const credit = await prisma.prepaidCredit.findUnique({ where: { id } });
    if (!credit) return null;

    const newBalance = Math.max(0, Number(credit.balance) - amount);
    const actualDeduct = Math.min(amount, Number(credit.balance));

    const [updated] = await Promise.all([
      prisma.prepaidCredit.update({
        where: { id },
        data: { balance: newBalance },
      }),
      prisma.prepaidMovement.create({
        data: {
          credit_id: id,
          type: "debit",
          amount: actualDeduct,
          balance_after: newBalance,
        },
      }),
    ]);

    return updated;
  }

  async getMaxSubscriptionSeq(datePart: string) {
    const prefix = `SUB-${datePart}-`;
    const subs = await prisma.monthlySubscription.findMany({
      where: { subscription_id: { startsWith: prefix } },
      select: { subscription_id: true },
      orderBy: { subscription_id: "desc" },
      take: 1,
    });

    if (subs.length === 0) return 0;
    const lastId = subs[0].subscription_id;
    const seqPart = lastId.split("-").pop();
    return seqPart ? parseInt(seqPart, 10) : 0;
  }

  async getMaxCreditSeq(datePart: string) {
    const prefix = `CRD-${datePart}-`;
    const credits = await prisma.prepaidCredit.findMany({
      where: { credit_id: { startsWith: prefix } },
      select: { credit_id: true },
      orderBy: { credit_id: "desc" },
      take: 1,
    });

    if (credits.length === 0) return 0;
    const lastId = credits[0].credit_id;
    const seqPart = lastId.split("-").pop();
    return seqPart ? parseInt(seqPart, 10) : 0;
  }

  async checkRateOverlap(
    category: string,
    structureId: number,
    from?: Date,
    to?: Date
  ) {
    const where: any = {
      category: category as any,
      structure_id: structureId,
      is_active: true,
    };

    if (from || to) {
      where.AND = [];
      if (from) {
        where.AND.push({ NOT: { valid_to: { lt: from } } });
      }
      if (to) {
        where.AND.push({ NOT: { valid_from: { gt: to } } });
      }
    }

    return prisma.rate.findFirst({ where });
  }

  async createRateChangeNotification(
    rateId: number,
    notificationType: string,
    message: string
  ) {
    return prisma.rateChangeNotification.create({
      data: {
        rate_id: rateId,
        notification_type: notificationType,
        message,
      },
    });
  }

  async createSubscriptionNotification(
    subscriptionId: number,
    message: string,
    daysRemaining: number
  ) {
    return prisma.subscriptionNotification.create({
      data: {
        subscription_id: subscriptionId,
        message,
        days_remaining: daysRemaining,
      },
    });
  }

  async createCreditNotification(
    creditId: number,
    message: string,
    percentage: number
  ) {
    return prisma.creditNotification.create({
      data: {
        credit_id: creditId,
        message,
        percentage,
      },
    });
  }
}

export const ratesRepository = new RatesRepository();
