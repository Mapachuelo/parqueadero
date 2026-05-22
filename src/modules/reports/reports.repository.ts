import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ReportsRepository {
  async getOccupancyReport(from?: string, to?: string) {
    const totalSpaces = await prisma.parkingSpace.count();

    const now = new Date();
    const recent = await prisma.vehicleTransaction.count({
      where: { status: "active" },
    });

    return {
      total_spaces: totalSpaces,
      occupied_spaces: recent,
      free_spaces: totalSpaces - recent,
      occupancy_pct: totalSpaces > 0 ? (recent / totalSpaces) * 100 : 0,
      timestamp: now,
    };
  }

  async getOccupancyHistory(from?: string, to?: string) {
    const where: any = {};
    if (from) where.entry_time = { ...where.entry_time, gte: new Date(from) };
    if (to) where.entry_time = { ...where.entry_time, lte: new Date(to) };

    const totalSpaces = await prisma.parkingSpace.count();

    const transactions = await prisma.vehicleTransaction.findMany({
      where: {
        ...where,
        status: { in: ["active", "completed"] },
      },
      select: {
        entry_time: true,
        exit_time: true,
        duration_minutes: true,
        space_assigned: true,
        status: true,
      },
      orderBy: { entry_time: "asc" },
    });

    return { totalSpaces, transactions };
  }

  async getRevenueReport(from?: string, to?: string, filters?: {
    category?: string;
    paymentMethod?: string;
  }) {
    const where: any = {};
    if (from) where.entry_time = { ...where.entry_time, gte: new Date(from) };
    if (to) where.entry_time = { ...where.entry_time, lte: new Date(to) };
    where.status = "completed";
    if (filters?.category) where.category = filters.category;

    const transactions = await prisma.vehicleTransaction.findMany({
      where,
      select: {
        id: true,
        category: true,
        final_amount: true,
        discount_amount: true,
        billing_mode: true,
        payment: {
          select: {
            payment_method: true,
            amount_paid: true,
          },
        },
      },
    });

    const byCategory: Record<string, { count: number; revenue: number; discounts: number }> = {};
    const byPaymentMethod: Record<string, { count: number; revenue: number }> = {};
    let totalRevenue = 0;
    let totalDiscounts = 0;
    let totalTransactions = 0;

    for (const txn of transactions) {
      const amount = Number(txn.final_amount ?? 0);
      const discount = Number(txn.discount_amount ?? 0);
      const method = txn.payment?.payment_method ?? "sin_pago";

      if (!byCategory[txn.category]) {
        byCategory[txn.category] = { count: 0, revenue: 0, discounts: 0 };
      }
      byCategory[txn.category].count++;
      byCategory[txn.category].revenue += amount;
      byCategory[txn.category].discounts += discount;

      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { count: 0, revenue: 0 };
      }
      byPaymentMethod[method].count++;
      byPaymentMethod[method].revenue += amount;

      totalRevenue += amount;
      totalDiscounts += discount;
      totalTransactions++;

      if (filters?.paymentMethod && method !== filters.paymentMethod) {
        totalRevenue -= amount;
        totalDiscounts -= discount;
        totalTransactions--;
      }
    }

    return {
      total_transactions: totalTransactions,
      total_revenue: totalRevenue,
      total_discounts: totalDiscounts,
      avg_per_transaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      by_category: byCategory,
      by_payment_method: byPaymentMethod,
    };
  }

  async getTransactionReport(filters: {
    from?: string;
    to?: string;
    category?: string;
    paymentMethod?: string;
    operatorId?: number;
    page?: number;
    limit?: number;
  }) {
    const { from, to, category, paymentMethod, operatorId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (from || to) {
      where.entry_time = {};
      if (from) where.entry_time.gte = new Date(from);
      if (to) where.entry_time.lte = new Date(to);
    }
    if (category) where.category = category;
    if (paymentMethod) {
      where.payment = { payment_method: paymentMethod };
    }
    if (operatorId) {
      where.OR = [
        { entry_operator_id: operatorId },
        { exit_operator_id: operatorId },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.vehicleTransaction.findMany({
        where,
        include: {
          entryOperator: { select: { id: true, username: true, full_name: true } },
          exitOperator: { select: { id: true, username: true, full_name: true } },
          payment: { select: { payment_method: true, amount_paid: true, change_amount: true, prepaid_used: true } },
          tickets: { select: { ticket_number: true, custody_terms_version: true, ticket_type: true } },
        },
        skip,
        take: limit,
        orderBy: { entry_time: "desc" },
      }),
      prisma.vehicleTransaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getTransactionReportForOperator(operatorId: number, filters: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getTransactionReport({ ...filters, operatorId });
  }

  async getUserActivityReport(from?: string, to?: string) {
    const where: any = {};
    if (from) where.entry_time = { ...where.entry_time, gte: new Date(from) };
    if (to) where.entry_time = { ...where.entry_time, lte: new Date(to) };

    const operators = await prisma.user.findMany({
      where: { role: { in: ["admin", "operador"] } },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        transactionsOperator: {
          where,
          select: {
            id: true,
            final_amount: true,
            discount_amount: true,
            status: true,
            entry_time: true,
          },
        },
        transactionsExitOp: {
          where: { exit_time: from ? { gte: new Date(from) } : undefined },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return operators.map((op: any) => {
      const entries = op.transactionsOperator as any[];
      const exits = op.transactionsExitOp as any[];

      const totalTransactions = entries.length;
      const totalRevenue = entries.reduce((sum: number, t: any) => sum + Number(t.final_amount ?? 0), 0);
      const totalDiscounts = entries.reduce((sum: number, t: any) => sum + Number(t.discount_amount ?? 0), 0);
      const completedTransactions = entries.filter((t: any) => t.status === "completed").length;
      const cancelledTransactions = entries.filter((t: any) => t.status === "cancelled").length;

      const uniqueDays = new Set(
        entries.map((t: any) => t.entry_time.toISOString().split("T")[0])
      ).size;

      return {
        operator_id: op.id,
        username: op.username,
        full_name: op.full_name,
        role: op.role,
        total_transactions: totalTransactions,
        completed_transactions: completedTransactions,
        cancelled_transactions: cancelledTransactions,
        total_revenue: totalRevenue,
        total_discounts: totalDiscounts,
        days_active: uniqueDays,
        entries_processed: entries.length,
        exits_processed: exits.length,
      };
    });
  }

  async getComplianceReport(from?: string, to?: string) {
    const where: any = {};
    if (from) where.entry_time = { ...where.entry_time, gte: new Date(from) };
    if (to) where.entry_time = { ...where.entry_time, lte: new Date(to) };

    const totalTransactions = await prisma.vehicleTransaction.count({ where });

    const withEntryTicket = await prisma.vehicleTransaction.count({
      where: {
        ...where,
        tickets: { some: { ticket_type: "entrada" } },
      },
    });

    const withCustodyTerms = await prisma.vehicleTransaction.count({
      where: {
        ...where,
        tickets: { some: { ticket_type: "entrada", custody_terms_version: { not: null } } },
      },
    });

    const now = new Date();

    const [totalClaims, openClaims, resolvedOnTime, expiredClaims] = await Promise.all([
      prisma.claim.count({
        where: from || to ? {
          created_at: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {},
      }),
      prisma.claim.count({
        where: {
          status: { in: ["abierto", "en_investigacion"] },
          ...(from || to ? {
            created_at: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          } : {}),
        },
      }),
      prisma.claim.count({
        where: {
          status: "resuelto",
          resolution_deadline: { not: null },
          resolution_date: { not: null },
          ...(from || to ? {
            created_at: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          } : {}),
        },
      }),
      prisma.claim.count({
        where: {
          status: "vencido",
          ...(from || to ? {
            created_at: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          } : {}),
        },
      }),
    ]);

    return {
      total_transactions: totalTransactions,
      tickets_emitted: withEntryTicket,
      tickets_pct: totalTransactions > 0 ? (withEntryTicket / totalTransactions) * 100 : 0,
      custody_terms_count: withCustodyTerms,
      custody_terms_pct: totalTransactions > 0 ? (withCustodyTerms / totalTransactions) * 100 : 0,
      claims: {
        total: totalClaims,
        open: openClaims,
        resolved_on_time: resolvedOnTime,
        expired: expiredClaims,
      },
    };
  }
}

export const reportsRepository = new ReportsRepository();
