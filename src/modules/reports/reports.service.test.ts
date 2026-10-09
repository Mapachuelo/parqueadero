import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportsService } from "./reports.service.js";
import { Role } from "../../shared/types/enums.js";
import { encryptPlateToBuffer } from "../../shared/utils/crypto.js";

const mockRepo = {
  getOccupancyReport: vi.fn(),
  getOccupancyHistory: vi.fn(),
  getRevenueReport: vi.fn(),
  getTransactionReport: vi.fn(),
  getTransactionReportForOperator: vi.fn(),
  getUserActivityReport: vi.fn(),
  getComplianceReport: vi.fn(),
};

const service = new ReportsService(mockRepo as any);
const plateBuffer = encryptPlateToBuffer("ABC-123");

function txn(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    transaction_id: "TXN-20260927-00001",
    plate_encrypted: plateBuffer,
    plate: null,
    category: "A",
    customer_name: "Cliente",
    customer_phone: null,
    entry_time: new Date("2026-09-27T14:00:00Z"),
    exit_time: null,
    duration_minutes: 120,
    billing_mode: "hora",
    rate_per_hour: 5000,
    total_amount: 10000,
    discount_amount: 0,
    final_amount: 10000,
    status: "completed",
    space_assigned: "A-001",
    entryOperator: null,
    exitOperator: null,
    payment: null,
    tickets: [],
    ...overrides,
  };
}

describe("ReportsService (RF-REPORT-001..005)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("RF-REPORT-001: ocupacion actual sin historico si no hay fechas", async () => {
    mockRepo.getOccupancyReport.mockResolvedValue({
      total_spaces: 100, occupied_spaces: 35, free_spaces: 65, occupancy_pct: 35.0,
    });

    const result = await service.buildOccupancyReport();

    expect(result.current.total_spaces).toBe(100);
    expect(result.current.occupancy_pct).toBe(35);
    expect(result.historical).toBeNull();
  });

  it("RF-REPORT-001: calcula hora pico, promedio y salidas con rango", async () => {
    mockRepo.getOccupancyReport.mockResolvedValue({
      total_spaces: 100, occupied_spaces: 0, free_spaces: 100, occupancy_pct: 0,
    });
    mockRepo.getOccupancyHistory.mockResolvedValue({
      transactions: [
        txn({ entry_time: new Date("2026-09-27T14:00:00Z"), duration_minutes: 120, status: "completed" }),
        txn({ id: 2, entry_time: new Date("2026-09-27T14:30:00Z"), duration_minutes: 60, status: "active" }),
        txn({ id: 3, entry_time: new Date("2026-09-27T18:00:00Z"), duration_minutes: 30, status: "completed" }),
      ],
    });

    const result = await service.buildOccupancyReport("2026-09-01", "2026-09-30");

    expect(result.historical?.peak_entry_hour).toBe("14:00");
    expect(result.historical?.avg_duration_minutes).toBe(70);
    expect(result.historical?.total_entries).toBe(3);
    expect(result.historical?.total_exits).toBe(2);
  });

  it("RF-REPORT-002: reporte de ingresos con desglose", async () => {
    mockRepo.getRevenueReport.mockResolvedValue({
      total_transactions: 3,
      total_revenue: 450000,
      total_discounts: 0,
      avg_per_transaction: 150000,
      by_category: { A: { count: 3, revenue: 450000, discounts: 0 } },
      by_payment_method: { efectivo: { count: 3, revenue: 450000 } },
    });

    const result = await service.buildRevenueReport("2026-09-01", "2026-09-30");

    expect(result.summary.total_revenue).toBe(450000);
    expect(result.by_category[0].category).toBe("A");
    expect(result.by_payment_method[0].payment_method).toBe("efectivo");
  });

  it("RF-REPORT-003: operador solo ve sus transacciones y la placa va enmascarada", async () => {
    mockRepo.getTransactionReportForOperator.mockResolvedValue({
      data: [txn()], total: 1, page: 1, limit: 20,
    });

    const result = await service.buildTransactionReport(Role.OPERADOR, 2, { page: 1, limit: 20 });

    expect(mockRepo.getTransactionReportForOperator).toHaveBeenCalledWith(2, expect.anything());
    expect(result.data[0].plate).toMatch(/^ABC/);
    expect(result.data[0].plate).toContain("*");
  });

  it("RF-REPORT-003: admin usa el reporte general", async () => {
    mockRepo.getTransactionReport.mockResolvedValue({ data: [txn()], total: 1, page: 1, limit: 20 });

    await service.buildTransactionReport(Role.ADMIN, 1, {});

    expect(mockRepo.getTransactionReport).toHaveBeenCalled();
    expect(mockRepo.getTransactionReportForOperator).not.toHaveBeenCalled();
  });

  it("RF-REPORT-004: actividad de usuarios con ranking y productividad", async () => {
    mockRepo.getUserActivityReport.mockResolvedValue([
      { operator_id: 2, username: "operador", total_transactions: 5, days_active: 2 },
      { operator_id: 1, username: "admin", total_transactions: 10, days_active: 4 },
    ]);

    const result = await service.buildUserActivityReport();

    expect(result.operators[0].username).toBe("admin");
    expect(result.operators[0].rank).toBe(1);
    expect(result.operators[0].productivity_score).toBe(2.5);
  });

  it("RF-REPORT-005: reporte de compliance con porcentajes", async () => {
    mockRepo.getComplianceReport.mockResolvedValue({
      total_transactions: 10,
      tickets_emitted: 10,
      tickets_pct: 100,
      custody_terms_count: 10,
      custody_terms_pct: 100,
      claims: { total: 1, open: 0, resolved_on_time: 1, expired: 0 },
    });

    const result = await service.buildComplianceReport();

    expect(result.tickets.emission_rate_pct).toBe(100);
    expect(result.tickets.custody_terms_rate_pct).toBe(100);
    expect(result.claims.resolved_on_time).toBe(1);
  });
});
