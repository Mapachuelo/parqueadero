import { describe, it, expect } from "vitest";
import { dateRangeSchema, reportFiltersSchema } from "./reports.schema.js";

describe("ReportsSchema", () => {
  it("acepta fechas YYYY-MM-DD y las convierte a rango ISO", () => {
    const result = dateRangeSchema.parse({ from: "2026-08-24", to: "2026-08-24" });
    expect(result.from).toBe(new Date("2026-08-24T00:00:00.000").toISOString());
    expect(result.to).toBe(new Date("2026-08-24T23:59:59.999").toISOString());
  });

  it("acepta datetime ISO sin transformar", () => {
    const result = dateRangeSchema.parse({
      from: "2026-08-24T00:00:00.000Z",
      to: "2026-08-24T23:59:59.999Z",
    });
    expect(result.from).toBe("2026-08-24T00:00:00.000Z");
    expect(result.to).toBe("2026-08-24T23:59:59.999Z");
  });

  it("rechaza formatos de fecha invalidos", () => {
    expect(() => dateRangeSchema.parse({ from: "24-08-2026" })).toThrow();
  });

  it("reportFiltersSchema conserva filtros y aplica rango de fin de dia", () => {
    const result = reportFiltersSchema.parse({
      from: "2026-08-24",
      to: "2026-08-24",
      category: "A",
      operatorId: 3,
      page: 2,
      limit: 10,
    });
    expect(result.from).toBe(new Date("2026-08-24T00:00:00.000").toISOString());
    expect(result.to).toBe(new Date("2026-08-24T23:59:59.999").toISOString());
    expect(result.category).toBe("A");
    expect(result.operatorId).toBe(3);
    expect(result.page).toBe(2);
  });
});