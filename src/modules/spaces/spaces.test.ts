import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpacesService } from "./spaces.service.js";

const mockRepo = {
  findAllSpaces: vi.fn(),
  getOccupancySummary: vi.fn(),
  findSpaceByCode: vi.fn(),
  getActiveTransactionForSpace: vi.fn(),
  cancelTransaction: vi.fn(),
  releaseSpace: vi.fn(),
};

const service = new SpacesService(mockRepo as any);

describe("SpacesService (RF-ESPACIO-001)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista espacios con su estado", async () => {
    mockRepo.findAllSpaces.mockResolvedValue([
      { id: 1, space_code: "A-001", zone: "General", is_occupied: true, current_transaction_id: "TXN-1" },
    ]);
    const result = await service.getSpaces();
    expect(result[0].space_code).toBe("A-001");
    expect(result[0].is_occupied).toBe(true);
  });

  it("nivel normal por debajo de 90%", async () => {
    mockRepo.getOccupancySummary.mockResolvedValue({ total: 100, occupied: 50, free: 50, pct: 50 });
    const result = await service.getOccupancy();
    expect(result.level).toBe("normal");
    expect(result.message).toBeNull();
  });

  it("alerta a partir del 95%", async () => {
    mockRepo.getOccupancySummary.mockResolvedValue({ total: 100, occupied: 96, free: 4, pct: 96 });
    const result = await service.getOccupancy();
    expect(result.level).toBe("alerta");
    expect(result.message).toBe("Alta ocupacion");
  });

  it("lleno al 100%", async () => {
    mockRepo.getOccupancySummary.mockResolvedValue({ total: 100, occupied: 100, free: 0, pct: 100 });
    const result = await service.getOccupancy();
    expect(result.level).toBe("lleno");
  });

  it("liberar espacio inexistente lanza 404", async () => {
    mockRepo.findSpaceByCode.mockResolvedValue(null);
    await expect(service.releaseSpace(1, "A-999")).rejects.toThrow(/Espacio .*no encontrado/);
  });

  it("no libera un espacio ya libre", async () => {
    mockRepo.findSpaceByCode.mockResolvedValue({ id: 1, is_occupied: false });
    await expect(service.releaseSpace(1, "A-001")).rejects.toThrow("ya se encuentra libre");
  });

  it("libera el espacio y cancela la transaccion activa", async () => {
    mockRepo.findSpaceByCode.mockResolvedValue({ id: 1, is_occupied: true });
    mockRepo.getActiveTransactionForSpace.mockResolvedValue({ id: 9 });
    mockRepo.releaseSpace.mockResolvedValue({
      id: 1, space_code: "A-001", zone: "General", is_occupied: false, current_transaction_id: null,
    });

    const result = await service.releaseSpace(1, "A-001");

    expect(mockRepo.cancelTransaction).toHaveBeenCalledWith(9);
    expect(result.is_occupied).toBe(false);
  });

  it("checkOccupancyAlerts retorna el nivel sin mensaje si es normal", async () => {
    mockRepo.getOccupancySummary.mockResolvedValue({ total: 100, occupied: 10, free: 90, pct: 10 });
    const result = await service.checkOccupancyAlerts();
    expect(result).toEqual({ level: "normal", message: null });
  });
});
