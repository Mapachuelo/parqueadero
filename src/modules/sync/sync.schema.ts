import { z } from "zod";

export const syncPayloadSchema = z.object({
  deviceId: z.string().min(1),
  lastSyncTimestamp: z.string().datetime().optional(),
  transactions: z.array(z.object({
    transactionId: z.string(),
    plateEncrypted: z.string().min(1),
    plateHash: z.string().min(1),
    plate: z.string().optional(),
    category: z.enum(["A", "B", "C", "D"]),
    customerName: z.string().min(1).max(100),
    entryTime: z.string().datetime(),
    exitTime: z.string().datetime().optional(),
    billingMode: z.string().optional(),
    totalAmount: z.number().optional(),
    finalAmount: z.number().optional(),
    status: z.string(),
    spaceAssigned: z.string().optional(),
    operatorId: z.number().optional(),
    syncStatus: z.string().optional(),
  })).optional(),
  payments: z.array(z.object({
    transactionId: z.string(),
    paymentMethod: z.string(),
    amountPaid: z.number(),
    changeAmount: z.number().optional(),
    status: z.string(),
  })).optional(),
});

export const resolveConflictSchema = z.object({
  resolution: z.enum(["local_wins", "server_wins", "manual", "merged"]),
  mergedData: z.any().optional(),
});
