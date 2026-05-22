import { AppError } from "../../shared/errors/app-error.js";
import { decryptPlateFromBuffer, maskPlate } from "../../shared/utils/crypto.js";
import { ReportsRepository, reportsRepository } from "./reports.repository.js";
import { Role } from "../../shared/types/enums.js";

export class ReportsService {
  constructor(private repo: ReportsRepository) {}

  async buildOccupancyReport(from?: string, to?: string) {
    const current = await this.repo.getOccupancyReport(from, to);

    let historical: {
      peak_entry_hour: string;
      valley_entry_hour: string;
      avg_duration_minutes: number;
      max_concurrent: number;
      total_entries: number;
      total_exits: number;
    } | null = null;

    if (from || to) {
      const history = await this.repo.getOccupancyHistory(from, to);

      const hourlyMap: Record<string, number> = {};
      let totalDuration = 0;
      let durationCount = 0;
      let completedCount = 0;

      for (const txn of history.transactions) {
        const hour = txn.entry_time.toISOString().slice(11, 13) + ":00";
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;

        if (txn.duration_minutes) {
          totalDuration += txn.duration_minutes;
          durationCount++;
        }
        if (txn.status === "completed") completedCount++;
      }

      const sorted = Object.entries(hourlyMap).sort((a, b) => b[1] - a[1]);
      const peakHour = sorted.length > 0 ? sorted[0][0] : null;
      const valleyHour = sorted.length > 1 ? sorted[sorted.length - 1][0] : null;

      const activeCount = history.transactions.filter((t: any) => t.status === "active").length;

      historical = {
        peak_entry_hour: peakHour ?? "N/A",
        valley_entry_hour: valleyHour ?? "N/A",
        avg_duration_minutes: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
        max_concurrent: activeCount,
        total_entries: history.transactions.length,
        total_exits: completedCount,
      };
    }

    return {
      current: {
        total_spaces: current.total_spaces,
        occupied_spaces: current.occupied_spaces,
        free_spaces: current.free_spaces,
        occupancy_pct: Math.round(current.occupancy_pct * 100) / 100,
      },
      historical,
    };
  }

  async buildRevenueReport(from?: string, to?: string, filters?: {
    category?: string;
    paymentMethod?: string;
  }) {
    const data = await this.repo.getRevenueReport(from, to, filters);

    return {
      summary: {
        total_transactions: data.total_transactions,
        total_revenue: data.total_revenue,
        total_discounts: data.total_discounts,
        avg_per_transaction: Math.round(data.avg_per_transaction * 100) / 100,
      },
      by_category: Object.entries(data.by_category).map(([cat, val]) => ({
        category: cat,
        count: val.count,
        revenue: val.revenue,
        discounts: val.discounts,
      })),
      by_payment_method: Object.entries(data.by_payment_method).map(([method, val]) => ({
        payment_method: method,
        count: val.count,
        revenue: val.revenue,
      })),
      period: { from: from ?? null, to: to ?? null },
    };
  }

  async buildTransactionReport(
    userRole: Role,
    userId: number,
    filters: {
      from?: string;
      to?: string;
      category?: string;
      paymentMethod?: string;
      operatorId?: number;
      page?: number;
      limit?: number;
    }
  ) {
    let result;

    if (userRole === Role.OPERADOR) {
      result = await this.repo.getTransactionReportForOperator(userId, filters);
    } else {
      result = await this.repo.getTransactionReport(filters);
    }

    const data = result.data.map((txn: {
      plate_encrypted: Uint8Array;
      plate: string | null;
      id: number;
      transaction_id: string;
      category: string;
      customer_name: string;
      customer_phone: string | null;
      entry_time: Date;
      exit_time: Date | null;
      duration_minutes: number | null;
      billing_mode: string | null;
      rate_per_hour: any;
      total_amount: any;
      discount_amount: any;
      final_amount: any;
      status: string;
      space_assigned: string | null;
      entryOperator: any;
      exitOperator: any;
      payment: any;
      tickets: any[];
    }) => {
      let plate = "";
      try {
        plate = decryptPlateFromBuffer(txn.plate_encrypted);
      } catch {
        plate = txn.plate || "***";
      }

      return {
        id: txn.id,
        transaction_id: txn.transaction_id,
        plate: maskPlate(plate),
        category: txn.category,
        customer_name: txn.customer_name,
        customer_phone: txn.customer_phone,
        entry_time: txn.entry_time,
        exit_time: txn.exit_time,
        duration_minutes: txn.duration_minutes,
        billing_mode: txn.billing_mode,
        rate_per_hour: txn.rate_per_hour ? Number(txn.rate_per_hour) : null,
        total_amount: txn.total_amount ? Number(txn.total_amount) : null,
        discount_amount: txn.discount_amount ? Number(txn.discount_amount) : null,
        final_amount: txn.final_amount ? Number(txn.final_amount) : null,
        status: txn.status,
        space_assigned: txn.space_assigned,
        entry_operator: txn.entryOperator,
        exit_operator: txn.exitOperator,
        payment: txn.payment,
        tickets: txn.tickets,
      };
    });

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async buildUserActivityReport(from?: string, to?: string) {
    const operators = await this.repo.getUserActivityReport(from, to);

    const ranked = [...operators].sort((a, b) => b.total_transactions - a.total_transactions);

    return {
      operators: ranked.map((op, index) => ({
        ...op,
        rank: index + 1,
        productivity_score: op.days_active > 0
          ? Math.round((op.total_transactions / op.days_active) * 100) / 100
          : 0,
      })),
      period: { from: from ?? null, to: to ?? null },
    };
  }

  async buildComplianceReport(from?: string, to?: string) {
    const data = await this.repo.getComplianceReport(from, to);

    return {
      tickets: {
        total_transactions: data.total_transactions,
        tickets_emitted: data.tickets_emitted,
        emission_rate_pct: Math.round(data.tickets_pct * 100) / 100,
        with_custody_terms: data.custody_terms_count,
        custody_terms_rate_pct: Math.round(data.custody_terms_pct * 100) / 100,
      },
      claims: {
        total: data.claims.total,
        open: data.claims.open,
        resolved_on_time: data.claims.resolved_on_time,
        expired: data.claims.expired,
      },
      period: { from: from ?? null, to: to ?? null },
    };
  }
}

export const reportsService = new ReportsService(reportsRepository);
