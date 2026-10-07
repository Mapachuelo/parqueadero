import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionsService } from "./transactions.service.js";
import { encryptPlateToBuffer } from "../../shared/utils/crypto.js";

const mockRepo = {
  findActiveTransactions: vi.fn(),
  findByTransactionId: vi.fn(),
  findByPlateHash: vi.fn(),
};

const service = new TransactionsService(mockRepo as any);
const plateBuffer = encryptPlateToBuffer("ABC-123");

describe("TransactionsService - consultas (RF-RECEP-001/RF-SALIDA-001)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getActiveTransactions descifra la placa y arma el ticket", async () => {
    mockRepo.findActiveTransactions.mockResolvedValue({
      data: [
        {
          id: 1,
          transaction_id: "TXN-20260927-00001",
          plate_encrypted: plateBuffer,
          plate: null,
          category: "A",
          customer_name: "Cliente",
          entry_time: new Date(),
          space_assigned: "A-001",
          billing_mode: null,
          tickets: [{ ticket_number: "TKT-1", custody_terms_version: "1.0" }],
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await service.getActiveTransactions(1, 20);

    expect(result.total).toBe(1);
    expect(result.data[0].plate).toBe("ABC-123");
    expect(result.data[0].ticket).toEqual({ ticket_number: "TKT-1", custody_terms_version: "1.0" });
  });

  it("getTransaction busca por transaction_id", async () => {
    mockRepo.findByTransactionId.mockResolvedValue({
      id: 1,
      transaction_id: "TXN-20260927-00001",
      plate_encrypted: plateBuffer,
      plate: null,
    });

    const result = await service.getTransaction("TXN-20260927-00001");
    expect(result.plate).toBe("ABC-123");
    expect(result.plate_encrypted).toBeUndefined();
  });

  it("getTransaction cae a busqueda por placa", async () => {
    mockRepo.findByTransactionId.mockResolvedValue(null);
    mockRepo.findByPlateHash.mockResolvedValue({
      id: 2,
      transaction_id: "TXN-2",
      plate_encrypted: plateBuffer,
      plate: null,
    });

    const result = await service.getTransaction("ABC-123");
    expect(result.transaction_id).toBe("TXN-2");
    expect(mockRepo.findByPlateHash).toHaveBeenCalled();
  });

  it("getTransaction lanza 404 si no existe", async () => {
    mockRepo.findByTransactionId.mockResolvedValue(null);
    mockRepo.findByPlateHash.mockResolvedValue(null);
    await expect(service.getTransaction("NOPE")).rejects.toThrow(/Transaccion .*no encontrad/);
  });
});
