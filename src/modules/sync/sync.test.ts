import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncService } from "./sync.service.js";
import { ConflictResolution } from "../../shared/types/enums.js";

const mockRepo = {
  findTransactionByTransactionId: vi.fn(),
  findTransactionByPlateHashAndTime: vi.fn(),
  createConflict: vi.fn(),
  createTransaction: vi.fn(),
  findPaymentByVehicleTxnId: vi.fn(),
  createPayment: vi.fn(),
  createSyncLog: vi.fn(),
  findConflictById: vi.fn(),
  updateTransactionByTransactionId: vi.fn(),
  resolveConflict: vi.fn(),
  findAllConflicts: vi.fn(),
  getActiveRates: vi.fn(),
  getUsers: vi.fn(),
  getActiveSubscriptions: vi.fn(),
  getActiveCredits: vi.fn(),
  getLastSyncLog: vi.fn(),
  getAllSyncLogs: vi.fn(),
};

const service = new SyncService(mockRepo as any);

const txn = {
  transactionId: "TXN-20260927-00001",
  plateEncrypted: "00",
  plateHash: "hash",
  category: "A",
  customerName: "Cliente",
  entryTime: "2026-09-27T10:00:00.000Z",
  status: "completed",
};

describe("SyncService (RF-OFFLINE-001/002)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sincroniza una transaccion nueva", async () => {
    mockRepo.findTransactionByTransactionId.mockResolvedValue(null);
    mockRepo.findTransactionByPlateHashAndTime.mockResolvedValue(null);
    mockRepo.createTransaction.mockResolvedValue({});
    mockRepo.createSyncLog.mockResolvedValue({});

    const result = await service.receiveBatch("POS-1", { transactions: [txn] });

    expect(result.synced).toBe(1);
    expect(result.conflicts).toBe(0);
    expect(mockRepo.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ sync_status: "synced" })
    );
    expect(mockRepo.createSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" })
    );
  });

  it("detecta conflicto por transaction_id duplicado", async () => {
    mockRepo.findTransactionByTransactionId.mockResolvedValue({ id: 1, transaction_id: txn.transactionId });
    mockRepo.createConflict.mockResolvedValue({ id: 10 });
    mockRepo.createSyncLog.mockResolvedValue({});

    const result = await service.receiveBatch("POS-1", { transactions: [txn] });

    expect(result.synced).toBe(0);
    expect(result.conflicts).toBe(1);
    expect(result.conflictIds).toEqual([10]);
    expect(mockRepo.createSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" })
    );
  });

  it("detecta conflicto por placa y hora cercana", async () => {
    mockRepo.findTransactionByTransactionId.mockResolvedValue(null);
    mockRepo.findTransactionByPlateHashAndTime.mockResolvedValue({ id: 2, transaction_id: "TXN-OTRA" });
    mockRepo.createConflict.mockResolvedValue({ id: 11 });
    mockRepo.createSyncLog.mockResolvedValue({});

    const result = await service.receiveBatch("POS-1", { transactions: [txn] });

    expect(result.conflicts).toBe(1);
    expect(mockRepo.createConflict).toHaveBeenCalledWith(
      expect.objectContaining({ conflict_type: "data_conflict" })
    );
  });

  it("registra pagos de transacciones existentes sin duplicar", async () => {
    mockRepo.findTransactionByTransactionId.mockResolvedValue({ id: 1, transaction_id: txn.transactionId });
    mockRepo.findPaymentByVehicleTxnId.mockResolvedValue(null);
    mockRepo.createPayment.mockResolvedValue({});
    mockRepo.createSyncLog.mockResolvedValue({});

    await service.receiveBatch("POS-1", {
      payments: [{ transactionId: txn.transactionId, paymentMethod: "efectivo", amountPaid: 5000, status: "completed" }],
    });

    expect(mockRepo.createPayment).toHaveBeenCalled();
  });

  it("resolveConflict lanza 404 si no existe", async () => {
    mockRepo.findConflictById.mockResolvedValue(null);
    await expect(
      service.resolveConflict(1, 99, { resolution: ConflictResolution.SERVER_WINS })
    ).rejects.toThrow(/Conflicto .*no encontrado/);
  });

  it("resolveConflict rechaza conflicto ya resuelto", async () => {
    mockRepo.findConflictById.mockResolvedValue({ id: 1, resolution: "server_wins" });
    await expect(
      service.resolveConflict(1, 1, { resolution: ConflictResolution.SERVER_WINS })
    ).rejects.toThrow("ya fue resuelto");
  });

  it("resolveConflict con local_wins actualiza la transaccion del servidor", async () => {
    mockRepo.findConflictById.mockResolvedValue({
      id: 1,
      resolution: null,
      server_record_id: "TXN-20260927-00001",
      local_data: { customerName: "Local", category: "B", status: "completed" },
    });
    mockRepo.updateTransactionByTransactionId.mockResolvedValue({});
    mockRepo.resolveConflict.mockResolvedValue({ id: 1, resolution: "local_wins" });

    const result = await service.resolveConflict(1, 1, { resolution: ConflictResolution.LOCAL_WINS });

    expect(mockRepo.updateTransactionByTransactionId).toHaveBeenCalledWith(
      "TXN-20260927-00001",
      expect.objectContaining({ customer_name: "Local", sync_status: "synced" })
    );
    expect(result.resolution).toBe("local_wins");
  });

  it("getSyncStatus con deviceId incluye ultimo log", async () => {
    mockRepo.getLastSyncLog.mockResolvedValue({ id: 1 });
    mockRepo.getAllSyncLogs.mockResolvedValue([{ id: 1 }]);
    const result = await service.getSyncStatus("POS-1");
    expect(result.lastSync).toEqual({ id: 1 });
    expect(result.recentLogs).toHaveLength(1);
  });
});
