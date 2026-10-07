import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { transactionsService } from "../../modules/transactions/transactions.service.js";
import { paymentsService } from "../../modules/payments/payments.service.js";

const prisma = new PrismaClient();

describe("Integracion PostgreSQL: entrada -> salida -> pago", () => {
  let operatorId = 0;
  let plate = "";

  beforeAll(async () => {
    const operator = await prisma.user.findFirst({ where: { role: "operador" } });
    if (!operator) throw new Error("El seed no creo el usuario operador");
    operatorId = operator.id;
    plate = `ITA${Math.floor(100 + Math.random() * 899)}`;
  });

  it("RF-RECEP-001/004 + RF-SALIDA-001/004/005: flujo completo con espacio y ticket", async () => {
    const entry = await transactionsService.registerEntry(operatorId, {
      plate,
      category: "A",
      customerName: "Prueba Integracion",
      customerEmail: "cliente@ejemplo.com",
    });

    expect(entry.transaction_id).toMatch(/^TXN-\d{8}-\d{5}$/);
    expect(entry.space_assigned).toBeTruthy();
    expect(entry.ticket.ticket_number).toMatch(/^TKT-/);

    const spaceAfterEntry = await prisma.parkingSpace.findFirst({
      where: { space_code: entry.space_assigned! },
    });
    expect(spaceAfterEntry?.is_occupied).toBe(true);

    const created = await prisma.vehicleTransaction.findUnique({
      where: { transaction_id: entry.transaction_id },
    });
    expect(created?.customer_email).toBe("cliente@ejemplo.com");

    await prisma.vehicleTransaction.update({
      where: { transaction_id: entry.transaction_id },
      data: { entry_time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });

    const exit = await transactionsService.registerExit(operatorId, {
      transactionId: entry.transaction_id,
    });

    expect(exit.duration_minutes).toBeGreaterThanOrEqual(119);
    expect(exit.rounded_hours).toBe(2);
    expect(exit.final_amount).toBe(10000);

    const spaceAfterExit = await prisma.parkingSpace.findFirst({
      where: { space_code: entry.space_assigned! },
    });
    expect(spaceAfterExit?.is_occupied).toBe(false);

    const payment = await paymentsService.processPayment(operatorId, {
      transactionId: entry.transaction_id,
      paymentMethod: "efectivo",
      amountPaid: 20000,
      prepaidUsed: 0,
    });

    expect(payment.receipt.final_amount).toBe(10000);
    expect(payment.receipt.change_amount).toBe(10000);
    expect(payment.receipt.payment_method).toBe("efectivo");
    expect(payment.receipt.ticket_number).toMatch(/^TKT-/);

    const completed = await prisma.vehicleTransaction.findUnique({
      where: { transaction_id: entry.transaction_id },
    });
    expect(completed?.status).toBe("completed");

    const paymentRow = await prisma.payment.findFirst({
      where: { transaction_id: completed!.id },
    });
    expect(Number(paymentRow?.amount_paid)).toBe(20000);

    const tickets = await prisma.ticket.findMany({ where: { transaction_id: completed!.id } });
    expect(tickets.length).toBeGreaterThanOrEqual(2);
  });

  it("RF-RECEP-002: rechaza placa duplicada activa", async () => {
    const entry = await transactionsService.registerEntry(operatorId, {
      plate,
      category: "A",
      customerName: "Duplicado",
    });
    expect(entry.transaction_id).toMatch(/^TXN-/);

    await expect(
      transactionsService.registerEntry(operatorId, {
        plate,
        category: "A",
        customerName: "Duplicado",
      })
    ).rejects.toThrow(/entrada activa/);

    await transactionsService.registerExit(operatorId, { transactionId: entry.transaction_id });
  });

  it("RF-LEGAL-003: la placa se guarda cifrada y el hash permite buscar", async () => {
    const entry = await transactionsService.registerEntry(operatorId, {
      plate: "ITB777",
      category: "D",
      customerName: "Cifrado",
    });

    const row = await prisma.vehicleTransaction.findUnique({
      where: { transaction_id: entry.transaction_id },
    });
    expect(row?.plate_encrypted).toBeTruthy();
    expect(Buffer.from(row!.plate_encrypted).toString("utf8")).not.toContain("ITB777");
    expect(row?.plate_hash).toHaveLength(64);

    await transactionsService.registerExit(operatorId, { transactionId: entry.transaction_id });
  });
});
