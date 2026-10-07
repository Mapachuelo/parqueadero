import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./payments.repository.js", () => ({
  paymentsRepository: {
    findTransactionByTxnId: vi.fn(),
    findPaymentByTransactionId: vi.fn(),
    createPayment: vi.fn(),
    updateTransactionForPayment: vi.fn(),
    releaseSpace: vi.fn(),
    getActiveCustodyTerms: vi.fn(),
    createTicket: vi.fn(),
    findActiveCreditByPlateHash: vi.fn(),
    deductPrepaidCredit: vi.fn(),
  },
}));

import { paymentsService } from "./payments.service.js";
import { paymentsRepository } from "./payments.repository.js";

const repo = paymentsRepository as any;

describe("PaymentsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findPaymentByTransactionId.mockResolvedValue(null);
  });

  const activeTx = {
    id: 1,
    transaction_id: "TXN-20260803-00001",
    entry_time: new Date("2026-08-03T08:00:00Z"),
    exit_time: new Date("2026-08-03T09:00:00Z"),
    plate_hash: "abc",
    final_amount: 5000,
    billing_mode: "hora",
    space_assigned: "A-001",
    plate_encrypted: Buffer.from("mock"),
  };

  it("RF-SALIDA-004: procesa pago en efectivo con cambio correcto", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.createPayment.mockResolvedValue({ id: 1 });
    repo.updateTransactionForPayment.mockResolvedValue({});
    repo.releaseSpace.mockResolvedValue({});
    repo.getActiveCustodyTerms.mockResolvedValue({ version: "1.0" });
    repo.createTicket.mockResolvedValue({
      id: 1, ticket_number: "TKT-RECIBO", custody_terms_version: "1.0",
    });

    const result = await paymentsService.processPayment(1, {
      transactionId: "TXN-20260803-00001",
      paymentMethod: "efectivo",
      amountPaid: 10000,
      prepaidUsed: 0,
    });

    expect(result.change_amount).toBe(5000);
    expect(result.receipt.ticket_number).toBe("TKT-RECIBO");
    expect(result.receipt.payment_method).toBe("efectivo");
    expect(result.receipt.final_amount).toBe(5000);
  });

  it("RF-SALIDA-004: rechaza monto insuficiente en efectivo", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "TXN-20260803-00001",
        paymentMethod: "efectivo",
        amountPaid: 3000,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("Monto insuficiente");
  });

  it("exige que la salida este calculada antes del pago", async () => {
    const txSinSalida = { ...activeTx, exit_time: null };

    repo.findTransactionByTxnId.mockResolvedValue(txSinSalida);

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "TXN-20260803-00001",
        paymentMethod: "efectivo",
        amountPaid: 10000,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("Registre la salida del vehiculo");
  });

  it("rechaza transaccion inexistente", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(null);

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "NOPE",
        paymentMethod: "efectivo",
        amountPaid: 0,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("Transaccion");
  });

  it("rechaza doble pago en la misma transaccion", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.findPaymentByTransactionId.mockResolvedValue({ id: 9 });

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "TXN-20260803-00001",
        paymentMethod: "efectivo",
        amountPaid: 5000,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("ya tiene un pago registrado");
  });

  it("libera el espacio de parqueo al completar", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.createPayment.mockResolvedValue({ id: 2 });
    repo.updateTransactionForPayment.mockResolvedValue({});
    repo.releaseSpace.mockResolvedValue({});
    repo.getActiveCustodyTerms.mockResolvedValue({ version: "1.0" });
    repo.createTicket.mockResolvedValue({
      id: 2, ticket_number: "TKT-LIBERA", custody_terms_version: "1.0",
    });

    await paymentsService.processPayment(1, {
      transactionId: "TXN-20260803-00001",
      paymentMethod: "efectivo",
      amountPaid: 5000,
      prepaidUsed: 0,
    });

    expect(repo.releaseSpace).toHaveBeenCalledWith("A-001");
  });

  it("genera recibo con ticket_number y terminos de custodia", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.createPayment.mockResolvedValue({ id: 3 });
    repo.updateTransactionForPayment.mockResolvedValue({});
    repo.releaseSpace.mockResolvedValue({});
    repo.getActiveCustodyTerms.mockResolvedValue({ version: "1.0" });
    repo.createTicket.mockResolvedValue({
      id: 3, ticket_number: "TKT-RF-LEGAL-001", custody_terms_version: "1.0",
    });

    const result = await paymentsService.processPayment(1, {
      transactionId: "TXN-20260803-00001",
      paymentMethod: "tarjeta_debito",
      amountPaid: 5000,
      prepaidUsed: 0,
    });

    expect(result.receipt.ticket_number).toMatch(/^TKT-/);
    expect(result.receipt.payment_method).toBe("tarjeta_debito");
    expect(repo.createTicket).toHaveBeenCalledWith(expect.objectContaining({
      ticket_type: "salida",
      custody_terms_version: "1.0",
    }));
  });

  it("RF-TARIFA-004: abono sin credito activo es rechazado", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.findActiveCreditByPlateHash.mockResolvedValue(null);

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "TXN-20260803-00001",
        paymentMethod: "abono",
        amountPaid: 0,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("No se encontro un abono activo");
  });

  it("RF-TARIFA-004: abono con saldo suficiente cubre el total", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.findActiveCreditByPlateHash.mockResolvedValue({ id: 7, balance: 20000 });
    repo.deductPrepaidCredit.mockResolvedValue({});
    repo.createPayment.mockResolvedValue({ id: 4 });
    repo.updateTransactionForPayment.mockResolvedValue({});
    repo.releaseSpace.mockResolvedValue({});
    repo.getActiveCustodyTerms.mockResolvedValue({ version: "1.0" });
    repo.createTicket.mockResolvedValue({ id: 4, ticket_number: "TKT-ABONO", custody_terms_version: "1.0" });

    const result = await paymentsService.processPayment(1, {
      transactionId: "TXN-20260803-00001",
      paymentMethod: "abono",
      amountPaid: 0,
      prepaidUsed: 0,
    });

    expect(result.receipt.credit_used).toBe(5000);
    expect(result.receipt.amount_paid).toBe(0);
    expect(repo.deductPrepaidCredit).toHaveBeenCalledWith(7, 5000);
  });

  it("RF-TARIFA-004: pago mixto cuando el abono no alcanza", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.findActiveCreditByPlateHash.mockResolvedValue({ id: 7, balance: 2000 });
    repo.deductPrepaidCredit.mockResolvedValue({});
    repo.createPayment.mockResolvedValue({ id: 5 });
    repo.updateTransactionForPayment.mockResolvedValue({});
    repo.releaseSpace.mockResolvedValue({});
    repo.getActiveCustodyTerms.mockResolvedValue({ version: "1.0" });
    repo.createTicket.mockResolvedValue({ id: 5, ticket_number: "TKT-MIXTO", custody_terms_version: "1.0" });

    const result = await paymentsService.processPayment(1, {
      transactionId: "TXN-20260803-00001",
      paymentMethod: "abono",
      amountPaid: 5000,
      prepaidUsed: 0,
    });

    expect(result.receipt.billing_mode).toBe("mixto");
    expect(result.receipt.credit_used).toBe(2000);
    expect(result.receipt.change_amount).toBe(2000);
  });

  it("RF-TARIFA-004: pago mixto rechaza monto insuficiente tras abono", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);
    repo.findActiveCreditByPlateHash.mockResolvedValue({ id: 7, balance: 2000 });

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "TXN-20260803-00001",
        paymentMethod: "abono",
        amountPaid: 1000,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("Saldo de abono insuficiente");
  });

  it("rechaza monto insuficiente en pago con tarjeta", async () => {
    repo.findTransactionByTxnId.mockResolvedValue(activeTx);

    await expect(
      paymentsService.processPayment(1, {
        transactionId: "TXN-20260803-00001",
        paymentMethod: "tarjeta_credito",
        amountPaid: 1000,
        prepaidUsed: 0,
      })
    ).rejects.toThrow("Monto insuficiente");
  });
});
