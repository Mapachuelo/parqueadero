import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./claims.repository.js", () => ({
  claimsRepository: {
    findClaimById: vi.fn(),
    findClaimByClaimId: vi.fn(),
    getMaxClaimSeq: vi.fn(),
    findTransactionByTxnId: vi.fn(),
    createClaim: vi.fn(),
    findAllClaims: vi.fn(),
    updateClaim: vi.fn(),
    addEvidence: vi.fn(),
    addNote: vi.fn(),
    resolveClaim: vi.fn(),
  },
}));

import { claimsService } from "./claims.service.js";
import { claimsRepository } from "./claims.repository.js";

const repo = claimsRepository as any;

describe("ClaimsService (RF-LEGAL-004)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea un reclamo con ID unico y plazo de 30 dias", async () => {
    repo.getMaxClaimSeq.mockResolvedValue(0);
    repo.createClaim.mockImplementation(async (data: any) => ({ id: 1, ...data }));

    const result = await claimsService.createClaim(2, {
      category: "cobro_incorrecto",
      description: "Cobro incorrecto en la salida",
    });

    expect(result.claim_id).toMatch(/^CLM-\d{8}-00001$/);
    expect(result.status).toBe("abierto");
    expect(repo.createClaim).toHaveBeenCalledWith(
      expect.objectContaining({ reported_by: 2, category: "cobro_incorrecto" })
    );
    const deadline = new Date(result.resolution_deadline ?? new Date());
    const diffDays = Math.round((deadline.getTime() - Date.now()) / 86400000);
    expect(diffDays).toBe(30);
  });

  it("rechaza reclamo con transaccion inexistente", async () => {
    repo.getMaxClaimSeq.mockResolvedValue(0);
    repo.findTransactionByTxnId.mockResolvedValue(null);

    await expect(
      claimsService.createClaim(1, {
        transactionId: "TXN-NOEXISTE",
        category: "otro",
        description: "Descripcion valida",
      })
    ).rejects.toThrow(/Transaccion .*no encontrad/);
  });

  it("asocia el id numerico de la transaccion cuando existe", async () => {
    repo.getMaxClaimSeq.mockResolvedValue(1);
    repo.findTransactionByTxnId.mockResolvedValue({ id: 42 });
    repo.createClaim.mockImplementation(async (data: any) => ({ id: 2, ...data }));

    const result = await claimsService.createClaim(1, {
      transactionId: "TXN-20260927-00001",
      category: "danio",
      description: "Dano en la carroceria",
    });

    expect(result.transaction_id).toBe(42);
  });

  it("getClaim lanza 404 si no existe", async () => {
    repo.findClaimById.mockResolvedValue(null);
    repo.findClaimByClaimId.mockResolvedValue(null);
    await expect(claimsService.getClaim("99")).rejects.toThrow(/Reclamo .*no encontrado/);
  });

  it("updateClaim mapea los campos enviados", async () => {
    repo.findClaimById.mockResolvedValue({ id: 5, status: "abierto" });
    repo.updateClaim.mockResolvedValue({ id: 5, status: "en_investigacion" });

    await claimsService.updateClaim(1, "5", { status: "en_investigacion", assignedTo: 3 });

    expect(repo.updateClaim).toHaveBeenCalledWith(5, {
      status: "en_investigacion",
      assigned_to: 3,
    });
  });

  it("addNote agrega la nota al reclamo", async () => {
    repo.findClaimByClaimId.mockResolvedValue({ id: 5 });
    repo.addNote.mockResolvedValue({ id: 1, content: "Seguimiento" });

    await claimsService.addNote(1, "CLM-20260927-00001", "Seguimiento");

    expect(repo.addNote).toHaveBeenCalledWith(5, { content: "Seguimiento", author_id: 1 });
  });

  it("no permite resolver un reclamo ya finalizado", async () => {
    repo.findClaimById.mockResolvedValue({ id: 5, status: "resuelto" });
    await expect(
      claimsService.resolveClaim(1, "5", { resolution: "Listo" })
    ).rejects.toThrow("ya ha sido finalizado");
  });

  it("resuelve un reclamo abierto", async () => {
    repo.findClaimById.mockResolvedValue({ id: 5, status: "abierto" });
    repo.resolveClaim.mockResolvedValue({ id: 5, status: "resuelto" });

    const result = await claimsService.resolveClaim(1, "5", {
      resolution: "Compensado",
      compensationAmount: 10000,
    });

    expect(result.status).toBe("resuelto");
    expect(repo.resolveClaim).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ status: "resuelto", compensation_amount: 10000 })
    );
  });

  it("getClaims aplica paginacion por defecto", async () => {
    repo.findAllClaims.mockResolvedValue({ claims: [], total: 0 });
    await claimsService.getClaims({});
    expect(repo.findAllClaims).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });
});
