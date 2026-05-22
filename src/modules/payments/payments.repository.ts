import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const paymentsRepository = {
  async findTransactionByTxnId(transactionId: string) {
    const tx = await prisma.vehicleTransaction.findUnique({
      where: { transaction_id: transactionId },
    });
    if (!tx || tx.status !== "active") return null;
    return tx;
  },

  async createPayment(data: {
    transaction_id: number;
    payment_method: string;
    amount_paid: number;
    change_amount?: number;
    prepaid_used?: number;
    operator_id: number;
  }) {
    return prisma.payment.create({
      data: {
        transaction_id: data.transaction_id,
        payment_method: data.payment_method as any,
        amount_paid: data.amount_paid,
        change_amount: data.change_amount ?? 0,
        prepaid_used: data.prepaid_used ?? 0,
        operator_id: data.operator_id,
        status: "completed",
      },
    });
  },

  async updateTransactionForPayment(
    transactionId: string,
    data: {
      exit_time: Date;
      status: string;
      final_amount?: number;
      billing_mode?: string;
      exit_operator_id?: number;
      credit_used?: number;
      duration_minutes?: number;
    }
  ) {
    return prisma.vehicleTransaction.update({
      where: { transaction_id: transactionId },
      data: data as any,
    });
  },

  async releaseSpace(spaceCode: string) {
    return prisma.parkingSpace.updateMany({
      where: { space_code: spaceCode, is_occupied: true },
      data: { is_occupied: false, current_transaction_id: null },
    });
  },

  async createTicket(data: {
    transaction_id: number;
    ticket_type: string;
    custody_terms_version: string;
    ticket_number: string;
  }) {
    return prisma.ticket.create({
      data: {
        transaction_id: data.transaction_id,
        ticket_type: data.ticket_type as any,
        custody_terms_version: data.custody_terms_version,
        ticket_number: data.ticket_number,
      },
    });
  },

  async getActiveCustodyTerms() {
    return prisma.custodyTerms.findFirst({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
    });
  },

  async deductPrepaidCredit(creditId: number, amount: number) {
    const credit = await prisma.prepaidCredit.findUnique({
      where: { id: creditId },
    });
    if (!credit) return null;
    const currentBalance = Number(credit.balance);
    const newBalance = currentBalance - amount;
    const [updated] = await prisma.$transaction([
      prisma.prepaidCredit.update({
        where: { id: creditId },
        data: {
          balance: newBalance,
          is_active: newBalance <= 0 ? false : credit.is_active,
        },
      }),
      prisma.prepaidMovement.create({
        data: {
          credit_id: creditId,
          type: "consumo",
          amount,
          balance_after: newBalance,
        },
      }),
    ]);
    return updated;
  },

  async getActivePrepaidCredit(creditId: number) {
    return prisma.prepaidCredit.findFirst({
      where: { id: creditId, is_active: true },
    });
  },

  async findActiveCreditByPlateHash(plateHash: string) {
    return prisma.prepaidCredit.findFirst({
      where: { plate_hash: plateHash, is_active: true },
      orderBy: { created_at: "desc" },
    });
  },
};
