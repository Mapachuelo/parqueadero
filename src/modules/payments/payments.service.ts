import { AppError } from "../../shared/errors/app-error.js";
import { generateTicketNumber } from "../../shared/utils/ids.js";
import { calculateDurationMinutes } from "../../shared/utils/date.js";
import { paymentsRepository } from "./payments.repository.js";

export const paymentsService = {
  async processPayment(
    operatorId: number,
    data: {
      transactionId: string;
      paymentMethod: string;
      amountPaid: number;
      prepaidUsed: number;
    }
  ) {
    const { transactionId, paymentMethod, amountPaid } = data;

    const transaction = await paymentsRepository.findTransactionByTxnId(transactionId);
    if (!transaction) {
      throw AppError.notFound("Transaccion", transactionId);
    }

    const existingPayment = await paymentsRepository.findPaymentByTransactionId(transactionId);
    if (existingPayment) {
      throw AppError.badRequest("Esta transaccion ya tiene un pago registrado");
    }

    const exitTime = transaction.exit_time;
    if (!exitTime) {
      throw AppError.badRequest(
        "Registre la salida del vehiculo antes de procesar el pago"
      );
    }

    const durationMinutes = calculateDurationMinutes(transaction.entry_time, exitTime);
    const finalAmount = Number(transaction.final_amount ?? 0);

    let creditUsed = 0;
    let billingMode = transaction.billing_mode ?? "hora";
    let changeAmount = 0;
    let effectiveAmountPaid = amountPaid;

    if (paymentMethod === "abono") {
      const activeCredit = await paymentsRepository.findActiveCreditByPlateHash(transaction.plate_hash);
      if (!activeCredit) {
        throw AppError.badRequest("No se encontro un abono activo para esta placa");
      }

      const balance = Number(activeCredit.balance);

      if (balance >= finalAmount) {
        creditUsed = finalAmount;
        effectiveAmountPaid = 0;
        await paymentsRepository.deductPrepaidCredit(activeCredit.id, finalAmount);
      } else {
        creditUsed = balance;
        billingMode = "mixto";
        const remaining = finalAmount - balance;
        if (amountPaid < remaining) {
          throw AppError.badRequest(
            `Saldo de abono insuficiente. Restan ${remaining} por pagar`
          );
        }
        effectiveAmountPaid = amountPaid;
        changeAmount = amountPaid - remaining;
        await paymentsRepository.deductPrepaidCredit(activeCredit.id, balance);
      }
    } else if (paymentMethod === "efectivo") {
      if (amountPaid < finalAmount) {
        throw AppError.badRequest(
          `Monto insuficiente. Se requiere al menos ${finalAmount}`
        );
      }
      changeAmount = amountPaid - finalAmount;
    } else {
      if (amountPaid < finalAmount) {
        throw AppError.badRequest(
          `Monto insuficiente. Se requiere al menos ${finalAmount}`
        );
      }
    }

    const payment = await paymentsRepository.createPayment({
      transaction_id: transaction.id,
      payment_method: paymentMethod,
      amount_paid: effectiveAmountPaid,
      change_amount: changeAmount,
      prepaid_used: creditUsed,
      operator_id: operatorId,
    });

    await paymentsRepository.updateTransactionForPayment(transactionId, {
      exit_time: exitTime,
      status: "completed",
      final_amount: finalAmount,
      billing_mode: billingMode,
      exit_operator_id: operatorId,
      credit_used: creditUsed,
      duration_minutes: durationMinutes,
    });

    if (transaction.space_assigned) {
      await paymentsRepository.releaseSpace(transaction.space_assigned);
    }

    const custodyTerms = await paymentsRepository.getActiveCustodyTerms();
    const ticketNumber = generateTicketNumber();
    const ticket = await paymentsRepository.createTicket({
      transaction_id: transaction.id,
      ticket_type: "salida",
      custody_terms_version: custodyTerms?.version ?? "1.0",
      ticket_number: ticketNumber,
    });

    return {
      receipt: {
        ticket_number: ticket.ticket_number,
        transaction_id: transactionId,
        entry_time: transaction.entry_time,
        exit_time: exitTime,
        duration_minutes: durationMinutes,
        final_amount: finalAmount,
        credit_used: creditUsed,
        amount_paid: effectiveAmountPaid,
        change_amount: changeAmount,
        payment_method: paymentMethod,
        billing_mode: billingMode,
      },
      change_amount: changeAmount,
      payment_id: payment.id,
    };
  },
};
