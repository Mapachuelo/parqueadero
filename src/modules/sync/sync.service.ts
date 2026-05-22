import { AppError } from "../../shared/errors/app-error.js";
import { encryptPlateToBuffer } from "../../shared/utils/crypto.js";
import { SyncRepository, syncRepository } from "./sync.repository.js";
import { ConflictType, ConflictResolution } from "../../shared/types/enums.js";

type SyncTransaction = {
  transactionId: string;
  plateEncrypted: string;
  plateHash: string;
  plate?: string;
  category: string;
  customerName: string;
  entryTime: string;
  exitTime?: string;
  billingMode?: string;
  totalAmount?: number;
  finalAmount?: number;
  status: string;
  spaceAssigned?: string;
  operatorId?: number;
  syncStatus?: string;
};

type SyncPayment = {
  transactionId: string;
  paymentMethod: string;
  amountPaid: number;
  changeAmount?: number;
  status: string;
};

export class SyncService {
  constructor(private repo: SyncRepository) {}

  async receiveBatch(
    deviceId: string,
    payload: {
      transactions?: SyncTransaction[];
      payments?: SyncPayment[];
    }
  ) {
    const transactions = payload.transactions ?? [];
    const payments = payload.payments ?? [];

    let syncedCount = 0;
    const conflictIds: number[] = [];

    for (const txn of transactions) {
      const existingByTxnId = await this.repo.findTransactionByTransactionId(
        txn.transactionId
      );

      if (existingByTxnId) {
        const conflict = await this.repo.createConflict({
          table_name: "vehicle_transactions",
          local_record_id: txn.transactionId,
          server_record_id: existingByTxnId.transaction_id,
          conflict_type: ConflictType.DUPLICATE,
          local_data: txn,
          server_data: existingByTxnId,
        });
        conflictIds.push(conflict.id);
        continue;
      }

      const entryTime = new Date(txn.entryTime);
      const existingByTime = await this.repo.findTransactionByPlateHashAndTime(
        txn.plateHash,
        entryTime,
        5
      );

      if (existingByTime) {
        const conflict = await this.repo.createConflict({
          table_name: "vehicle_transactions",
          local_record_id: txn.transactionId,
          server_record_id: existingByTime.transaction_id,
          conflict_type: ConflictType.DATA_CONFLICT,
          local_data: txn,
          server_data: existingByTime,
        });
        conflictIds.push(conflict.id);
        continue;
      }

      let plateEncrypted: Buffer;
      if (txn.plate) {
        plateEncrypted = encryptPlateToBuffer(txn.plate);
      } else {
        plateEncrypted = Buffer.from(txn.plateEncrypted, "hex");
      }

      await this.repo.createTransaction({
        transaction_id: txn.transactionId,
        plate_encrypted: plateEncrypted,
        plate_hash: txn.plateHash,
        category: txn.category,
        customer_name: txn.customerName,
        entry_time: entryTime,
        exit_time: txn.exitTime ? new Date(txn.exitTime) : undefined,
        billing_mode: txn.billingMode,
        total_amount: txn.totalAmount,
        final_amount: txn.finalAmount,
        status: txn.status,
        space_assigned: txn.spaceAssigned,
        entry_operator_id: txn.operatorId,
        sync_status: "synced",
      });

      syncedCount++;
    }

    for (const pay of payments) {
      const vehicleTxn = await this.repo.findTransactionByTransactionId(
        pay.transactionId
      );

      if (!vehicleTxn) continue;

      const existingPayment = await this.repo.findPaymentByVehicleTxnId(vehicleTxn.id);
      if (existingPayment) continue;

      await this.repo.createPayment({
        transaction_id: vehicleTxn.id,
        payment_method: pay.paymentMethod,
        amount_paid: pay.amountPaid,
        change_amount: pay.changeAmount,
        status: pay.status,
      });
    }

    const conflictCount = conflictIds.length;
    const status =
      conflictCount > 0 && syncedCount > 0
        ? "partial"
        : conflictCount > 0
          ? "failed"
          : "completed";

    await this.repo.createSyncLog({
      device_id: deviceId,
      synced_count: syncedCount,
      conflict_count: conflictCount,
      status,
      message:
        conflictCount > 0
          ? `${syncedCount} sincronizados, ${conflictCount} conflictos detectados`
          : `Sincronizacion exitosa: ${syncedCount} registros`,
    });

    return {
      synced: syncedCount,
      conflicts: conflictCount,
      conflictIds,
    };
  }

  async resolveConflict(
    adminId: number,
    conflictId: number,
    data: {
      resolution: string;
      mergedData?: any;
    }
  ) {
    const conflict = await this.repo.findConflictById(conflictId);

    if (!conflict) {
      throw AppError.notFound("Conflicto", String(conflictId));
    }

    if (conflict.resolution) {
      throw AppError.conflict("Este conflicto ya fue resuelto");
    }

    const localData = conflict.local_data as Record<string, any> | null;
    const serverRecordId = conflict.server_record_id;

    if (data.resolution === ConflictResolution.LOCAL_WINS && serverRecordId && localData) {
      await this.repo.updateTransactionByTransactionId(serverRecordId, {
        customer_name: localData.customerName,
        category: localData.category,
        entry_time: localData.entryTime ? new Date(localData.entryTime as string) : undefined,
        exit_time: localData.exitTime ? new Date(localData.exitTime as string) : undefined,
        billing_mode: localData.billingMode,
        total_amount: localData.totalAmount,
        final_amount: localData.finalAmount,
        status: localData.status,
        space_assigned: localData.spaceAssigned,
        sync_status: "synced",
      });
    } else if (
      (data.resolution === ConflictResolution.MANUAL ||
        data.resolution === ConflictResolution.MERGED) &&
      serverRecordId
    ) {
      const merged = data.mergedData ?? {};
      await this.repo.updateTransactionByTransactionId(serverRecordId, {
        ...merged,
        sync_status: "synced",
      });
    }

    const updated = await this.repo.resolveConflict(
      conflict.id,
      data.resolution,
      adminId
    );

    return updated;
  }

  async getConflicts(page: number = 1, limit: number = 20) {
    return this.repo.findAllConflicts(page, limit);
  }

  async getRatesForDevice() {
    return this.repo.getActiveRates();
  }

  async getUsersForDevice() {
    return this.repo.getUsers();
  }

  async getSubscriptionsForDevice() {
    return this.repo.getActiveSubscriptions();
  }

  async getCreditsForDevice() {
    return this.repo.getActiveCredits();
  }

  async getSyncStatus(deviceId?: string) {
    if (deviceId) {
      const lastSync = await this.repo.getLastSyncLog(deviceId);
      const allLogs = await this.repo.getAllSyncLogs(20);
      return { lastSync, recentLogs: allLogs };
    }

    const allLogs = await this.repo.getAllSyncLogs(20);
    return { recentLogs: allLogs };
  }
}

export const syncService = new SyncService(syncRepository);
