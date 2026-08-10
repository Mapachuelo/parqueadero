import { describe, it, expect, vi, beforeEach } from "vitest";
import { RatesService } from "./rates.service.js";

const mockRepo: Record<string, any> = {
  createRateStructure: vi.fn(),
  findAllRateStructures: vi.fn(),
  findRateStructureById: vi.fn(),
  updateRateStructure: vi.fn(),
  activateStructure: vi.fn(),
  deactivateRateStructure: vi.fn(),
  createRate: vi.fn(),
  findActiveRates: vi.fn(),
  findActiveRateByCategory: vi.fn(),
  findRateHistory: vi.fn(),
  createFractionRate: vi.fn(),
  findAllFractionRates: vi.fn(),
  createSubscription: vi.fn(),
  findAllSubscriptions: vi.fn(),
  findSubscriptionById: vi.fn(),
  updateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  getSubscriptionByPlate: vi.fn(),
  getMaxSubscriptionSeq: vi.fn(),
  createCredit: vi.fn(),
  findAllCredits: vi.fn(),
  findCreditById: vi.fn(),
  rechargeCredit: vi.fn(),
  getCreditsByPlate: vi.fn(),
  findCreditByPlate: vi.fn(),
  getMaxCreditSeq: vi.fn(),
  checkRateOverlap: vi.fn(),
  createRateChangeHistory: vi.fn(),
};

const service = new RatesService(mockRepo as any);

describe("RatesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStructure", () => {
    it("RF-TARIFA-001: crea estructura tarifaria con nombre y descripcion", async () => {
      mockRepo.createRateStructure.mockResolvedValue({
        id: 1, name: "Tarifas 2026", description: "Enero-Junio",
      });

      const result = await service.createStructure(1, {
        name: "Tarifas 2026",
        description: "Enero-Junio",
      });

      expect(result.name).toBe("Tarifas 2026");
      expect(result.description).toBe("Enero-Junio");
    });

    it("crea estructura con fecha de vigencia", async () => {
      mockRepo.createRateStructure.mockResolvedValue({
        id: 2, name: "Tarifas Julio", effective_date: new Date("2026-07-01"),
      });

      const result = await service.createStructure(1, {
        name: "Tarifas Julio",
        effectiveDate: "2026-07-01",
      });

      expect(mockRepo.createRateStructure).toHaveBeenCalledWith(
        expect.objectContaining({
          effectiveDate: expect.any(Date),
        })
      );
    });
  });

  describe("createRate", () => {
    it("RF-TARIFA-001: crea tarifa con precio positivo", async () => {
      mockRepo.findRateStructureById = vi.fn().mockResolvedValue({ id: 1 });
      mockRepo.checkRateOverlap = vi.fn().mockResolvedValue(null);
      mockRepo.findActiveRateByCategory = vi.fn().mockResolvedValue(null);
      mockRepo.createRate.mockResolvedValue({
        id: 1, structure_id: 1, category: "A", price_per_hour: 5000,
      });

      const result = await service.createRate({
        structureId: 1,
        category: "A",
        pricePerHour: 5000,
      });

      expect(result.price_per_hour).toBe(5000);
      expect(result.category).toBe("A");
    });

    it("RF-TARIFA-001: pasa pricePerHour al repositorio", async () => {
      mockRepo.findRateStructureById = vi.fn().mockResolvedValue({ id: 1 });
      mockRepo.checkRateOverlap = vi.fn().mockResolvedValue(null);
      mockRepo.findActiveRateByCategory = vi.fn().mockResolvedValue(null);
      mockRepo.createRate.mockResolvedValue({
        id: 2, structure_id: 1, category: "B", price_per_hour: 8000,
      });

      await service.createRate({ structureId: 1, category: "B", pricePerHour: 8000 });

      expect(mockRepo.createRate).toHaveBeenCalledWith(
        expect.objectContaining({ pricePerHour: 8000, category: "B" })
      );
    });
  });

  describe("activateStructure", () => {
    it("RF-TARIFA-001: activa estructura tarifaria", async () => {
      mockRepo.findRateStructureById.mockResolvedValue({ id: 1, name: "T1" });
      mockRepo.activateStructure.mockResolvedValue({ id: 1, is_active: true, activated_at: new Date() });

      const result = await service.activateStructure(1);

      expect(result.is_active).toBe(true);
      expect(mockRepo.activateStructure).toHaveBeenCalledWith(1, expect.any(Date));
    });

    it("lanza NOT_FOUND si la estructura no existe", async () => {
      mockRepo.findRateStructureById.mockResolvedValue(null);

      await expect(
        service.activateStructure(999)
      ).rejects.toThrow("Estructura de tarifas");
    });
  });

  describe("createSubscription", () => {
    it("RF-TARIFA-004: registra mensualidad con placa y fechas validas", async () => {
      mockRepo.getMaxSubscriptionSeq.mockResolvedValue(0);
      mockRepo.createSubscription.mockResolvedValue({
        id: 1, subscription_id: "SUB-202608-00001",
        plate_hash: "abc", status: "activa",
      });

      const result = await service.createSubscription(1, {
        plate: "ABC-123",
        customerName: "Cliente Frecuente",
        monthlyAmount: 150000,
        startDate: "2026-08-01",
      });

      expect(result.subscription_id).toMatch(/^SUB-\d{6}-\d{5}$/);
      expect(result.status).toBe("activa");
      expect(mockRepo.getMaxSubscriptionSeq).toHaveBeenCalled();
      expect(mockRepo.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          plateHash: expect.any(String),
          monthlyAmount: 150000,
        })
      );
    });

    it("RF-TARIFA-004: duracion por defecto 1 mes", async () => {
      mockRepo.getMaxSubscriptionSeq.mockResolvedValue(0);
      mockRepo.createSubscription.mockResolvedValue({
        id: 2, subscription_id: "SUB-202608-00002", status: "activa",
      });

      await service.createSubscription(1, {
        plate: "DEF-456", customerName: "Test",
        monthlyAmount: 100000,
      });

      expect(mockRepo.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
        })
      );
    });
  });

  describe("createCredit", () => {
    it("RF-TARIFA-004: registra abono prepagado", async () => {
      mockRepo.getMaxCreditSeq.mockResolvedValue(0);
      mockRepo.createCredit.mockResolvedValue({
        id: 1, credit_id: "CRD-20260803-00001", balance: 50000,
      });
      mockRepo.rechargeCredit.mockResolvedValue({});

      const result = await service.createCredit(1, {
        plate: "ABC-123",
        customerName: "Cliente Abono",
        amount: 50000,
        expirationDate: "2026-12-31",
      });

      expect(result.credit_id).toMatch(/^CRD-\d{8}-\d{5}$/);
    });
  });
});
