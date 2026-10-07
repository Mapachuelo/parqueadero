import { describe, it, expect, vi, beforeEach } from "vitest";
import { RatesService } from "./rates.service.js";
import { encryptPlateToBuffer } from "../../shared/utils/crypto.js";

const mockRepo: Record<string, any> = {
  createRateStructure: vi.fn(),
  findAllRateStructures: vi.fn(),
  findRateStructureById: vi.fn(),
  updateRateStructure: vi.fn(),
  activateStructure: vi.fn(),
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
  getMaxSubscriptionSeq: vi.fn(),
  createCredit: vi.fn(),
  findAllCredits: vi.fn(),
  findCreditById: vi.fn(),
  rechargeCredit: vi.fn(),
  getMaxCreditSeq: vi.fn(),
  checkRateOverlap: vi.fn(),
  createRateChangeHistory: vi.fn(),
};

const service = new RatesService(mockRepo as any);

describe("RatesService - estructuras y tarifas (RF-TARIFA-001/002)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista estructuras", async () => {
    mockRepo.findAllRateStructures.mockResolvedValue([{ id: 1 }]);
    expect(await service.getStructures()).toHaveLength(1);
  });

  it("getStructureById lanza 404 si no existe", async () => {
    mockRepo.findRateStructureById.mockResolvedValue(null);
    await expect(service.getStructureById(9)).rejects.toThrow("Estructura de tarifas");
  });

  it("updateStructure valida existencia", async () => {
    mockRepo.findRateStructureById.mockResolvedValue({ id: 1 });
    mockRepo.updateRateStructure.mockResolvedValue({ id: 1, name: "Nueva" });
    const result = await service.updateStructure(1, { name: "Nueva" });
    expect(result.name).toBe("Nueva");
  });

  it("activateStructure usa la fecha indicada", async () => {
    mockRepo.findRateStructureById.mockResolvedValue({ id: 1 });
    mockRepo.activateStructure.mockResolvedValue({ id: 1, is_active: true });

    await service.activateStructure(1, "2026-10-01");

    expect(mockRepo.activateStructure).toHaveBeenCalledWith(1, new Date("2026-10-01"));
  });

  it("createRate rechaza solapamiento", async () => {
    mockRepo.findRateStructureById.mockResolvedValue({ id: 1 });
    mockRepo.checkRateOverlap.mockResolvedValue({ id: 5 });

    await expect(
      service.createRate({ structureId: 1, category: "A", pricePerHour: 6000 })
    ).rejects.toThrow("se solapa");
  });

  it("createRate registra historial de cambio", async () => {
    mockRepo.findRateStructureById.mockResolvedValue({ id: 1 });
    mockRepo.checkRateOverlap.mockResolvedValue(null);
    mockRepo.findActiveRateByCategory.mockResolvedValue({ id: 2, price_per_hour: 5000 });
    mockRepo.createRate.mockResolvedValue({ id: 3, category: "A", price_per_hour: 6000 });
    mockRepo.createRateChangeHistory.mockResolvedValue({});

    const result = await service.createRate({ structureId: 1, category: "A", pricePerHour: 6000 });

    expect(result.price_per_hour).toBe(6000);
    expect(mockRepo.createRateChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({ oldPrice: 5000, newPrice: 6000 })
    );
  });

  it("getRateHistory lanza 404 si la tarifa no existe", async () => {
    mockRepo.findAllRateStructures.mockResolvedValue([{ rates: [{ id: 1 }] }]);
    await expect(service.getRateHistory(99)).rejects.toThrow("Tarifa");
  });

  it("getRateHistory devuelve el historial", async () => {
    mockRepo.findAllRateStructures.mockResolvedValue([{ rates: [{ id: 1 }] }]);
    mockRepo.findRateHistory.mockResolvedValue([{ id: 1 }]);
    expect(await service.getRateHistory(1)).toHaveLength(1);
  });

  it("getActiveRates y getFractionRates delegan", async () => {
    mockRepo.findActiveRates.mockResolvedValue([{ category: "A" }]);
    mockRepo.findAllFractionRates.mockResolvedValue([{ category: "A" }]);
    expect(await service.getActiveRates()).toHaveLength(1);
    expect(await service.getFractionRates()).toHaveLength(1);
  });

  it("createFractionRate valida la estructura", async () => {
    mockRepo.findRateStructureById.mockResolvedValue(null);
    await expect(
      service.createFractionRate({ structureId: 9, category: "A", minutes15: 1, minutes30: 2, minutes45: 3 })
    ).rejects.toThrow("Estructura de tarifas");
  });
});

describe("RatesService - mensualidades (RF-TARIFA-004)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("createSubscription genera id y fecha fin", async () => {
    mockRepo.getMaxSubscriptionSeq.mockResolvedValue(0);
    mockRepo.createSubscription.mockImplementation(async (data: any) => ({ id: 1, ...data }));

    const result: any = await service.createSubscription(1, {
      plate: "ABC-123",
      customerName: "Cliente",
      monthlyAmount: 200000,
    });

    expect(result.subscriptionId).toMatch(/^SUB-\d{6}-00001$/);
    expect(result.endDate.getTime()).toBeGreaterThan(result.startDate.getTime());
  });

  it("getSubscriptions descifra la placa", async () => {
    mockRepo.findAllSubscriptions.mockResolvedValue({
      data: [{ id: 1, plate_encrypted: encryptPlateToBuffer("ABC-123") }],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await service.getSubscriptions({});
    expect(result.data[0].plate_decrypted).toBe("ABC-123");
  });

  it("renewSubscription lanza 404 si no existe", async () => {
    mockRepo.findSubscriptionById.mockResolvedValue(null);
    await expect(service.renewSubscription(9, 1)).rejects.toThrow("Suscripcion");
  });

  it("renewSubscription extiende la fecha fin", async () => {
    const end = new Date("2026-10-01T00:00:00Z");
    mockRepo.findSubscriptionById.mockResolvedValue({ id: 1, end_date: end });
    mockRepo.updateSubscription.mockImplementation(async (id: number, data: any) => ({ id, ...data }));

    const result: any = await service.renewSubscription(1, 2);
    expect(result.status).toBe("activa");
    expect(result.endDate.getTime()).toBeGreaterThan(end.getTime());
  });
});

describe("RatesService - abonos (RF-TARIFA-004)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("createCredit genera id y saldo inicial", async () => {
    mockRepo.getMaxCreditSeq.mockResolvedValue(0);
    mockRepo.createCredit.mockImplementation(async (data: any) => ({ id: 1, ...data }));
    mockRepo.rechargeCredit.mockResolvedValue({});

    const result: any = await service.createCredit(1, {
      plate: "ABC-123",
      customerName: "Cliente",
      amount: 50000,
    });

    expect(result.creditId).toMatch(/^CRD-\d{8}-00001$/);
    expect(result.balance).toBe(50000);
  });

  it("rechargeCredit lanza 404 si no existe", async () => {
    mockRepo.findCreditById.mockResolvedValue(null);
    await expect(service.rechargeCredit(9, 1000)).rejects.toThrow("Credito");
  });

  it("rechargeCredit exige monto positivo", async () => {
    mockRepo.findCreditById.mockResolvedValue({ id: 1 });
    await expect(service.rechargeCredit(1, 0)).rejects.toThrow("mayor a 0");
  });

  it("rechargeCredit recarga el saldo", async () => {
    mockRepo.findCreditById.mockResolvedValue({ id: 1 });
    mockRepo.rechargeCredit.mockResolvedValue({ id: 1, balance: 60000 });
    const result: any = await service.rechargeCredit(1, 10000);
    expect(result.balance).toBe(60000);
  });

  it("getCredits delega", async () => {
    mockRepo.findAllCredits.mockResolvedValue({ data: [], total: 0 });
    const result: any = await service.getCredits({});
    expect(result.total).toBe(0);
  });
});
