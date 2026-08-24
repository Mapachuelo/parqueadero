import { format } from "date-fns";
import { AppError } from "../../shared/errors/app-error.js";
import { encryptPlateToBuffer, hashPlate, decryptPlateFromBuffer } from "../../shared/utils/crypto.js";
import { generateTransactionId, generateTicketNumber } from "../../shared/utils/ids.js";
import { calculateDurationMinutes, roundDuration } from "../../shared/utils/date.js";
import { isValidPlate } from "../../shared/utils/plate.js";
import { TransactionsRepository, transactionsRepository } from "./transactions.repository.js";
import { BillingMode } from "../../shared/types/enums.js";

export class TransactionsService {
  constructor(private repo: TransactionsRepository) {}

  async registerEntry(
    operatorId: number,
    data: {
      plate: string;
      category: string;
      customerName: string;
      customerPhone?: string;
      isInternational?: boolean;
      countryOrigin?: string;
      vehicleDescription?: string;
    }
  ) {
    const plate = data.plate;
    if (!isValidPlate(plate)) {
      throw AppError.badRequest(
        "Formato de placa invalido. Use formato colombiano (ABC123) o internacional."
      );
    }

    const plateHash = hashPlate(plate);

    const existing = await this.repo.findActiveByPlateHash(plateHash);
    if (existing) {
      throw AppError.conflict(
        `El vehiculo con placa ${plate} ya tiene una entrada activa.`
      );
    }

    const plateBuffer = encryptPlateToBuffer(plate);

    const datePart = format(new Date(), "yyyyMMdd");
    const seq = await this.repo.getMaxSequenceForDate(datePart);
    const transactionId = generateTransactionId(seq + 1);

    const availableSpaces = await this.repo.countAvailableSpaces();
    if (availableSpaces === 0) {
      throw AppError.conflict("No hay espacios disponibles en el parqueadero.");
    }

    const space = await this.repo.assignSpace(transactionId);
    if (!space) {
      throw AppError.conflict("No hay espacios disponibles en el parqueadero.");
    }

    const subscription = await this.repo.findActiveSubscription(plateHash, new Date());

    const entryTime = new Date();

    const transaction = await this.repo.createTransaction({
      transaction_id: transactionId,
      plate_encrypted: plateBuffer,
      plate_hash: plateHash,
      category: data.category,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      is_international: data.isInternational ?? false,
      country_origin: data.countryOrigin,
      vehicle_description: data.vehicleDescription,
      entry_time: entryTime,
      entry_operator_id: operatorId,
      space_assigned: space.space_code,
      billing_mode: subscription ? BillingMode.MENSUALIDAD : undefined,
      status: "active",
      sync_status: "pending",
    });

    const custodyTermsVersion = await this.repo.getActiveCustodyTermsVersion();

    const ticket = await this.repo.createTicket({
      transaction_id: transaction.id,
      ticket_type: "entrada",
      ticket_number: generateTicketNumber(),
      custody_terms_version: custodyTermsVersion ?? undefined,
    });

    return {
      transaction_id: transaction.transaction_id,
      entry_time: transaction.entry_time,
      space_assigned: transaction.space_assigned,
      ticket: {
        ticket_number: ticket.ticket_number,
        custody_terms_version: ticket.custody_terms_version,
      },
    };
  }

  async registerExit(
    operatorId: number,
    identifier: { transactionId?: string; plate?: string }
  ) {
    let transaction: Awaited<ReturnType<TransactionsRepository["findActiveByTransactionId"]>> = null;

    if (identifier.transactionId) {
      transaction = await this.repo.findActiveByTransactionId(identifier.transactionId);
      if (!transaction) {
        const plateHash = hashPlate(identifier.transactionId.toUpperCase());
        transaction = await this.repo.findActiveByPlateHash(plateHash);
      }
    }
    if (!transaction && identifier.plate) {
      const plateHash = hashPlate(identifier.plate.toUpperCase());
      transaction = await this.repo.findActiveByPlateHash(plateHash);
    }

    if (!transaction) {
      throw AppError.notFound(
        "Transaccion activa no encontrada. Verifique el identificador o la placa."
      );
    }

    const exitTime = new Date();
    const durationMinutes = calculateDurationMinutes(transaction.entry_time, exitTime);
    const roundedHours = roundDuration(durationMinutes, 15);

    let billingMode = BillingMode.HORA;
    let ratePerHour = 0;
    let totalAmount = 0;
    let discountAmount = 0;

    const subscription = await this.repo.findActiveSubscription(transaction.plate_hash, exitTime);
    const prepaid = await this.repo.findActivePrepaidCredit(transaction.plate_hash);

    if (subscription) {
      billingMode = BillingMode.MENSUALIDAD;
      totalAmount = 0;
    } else if (prepaid) {
      billingMode = BillingMode.ABONO;
      const rate = await this.repo.findActiveRate(transaction.category);
      ratePerHour = rate ? Number(rate.price_per_hour) : 0;
      totalAmount = ratePerHour * roundedHours;
    } else {
      billingMode = BillingMode.HORA;
      const rate = await this.repo.findActiveRate(transaction.category);
      ratePerHour = rate ? Number(rate.price_per_hour) : 0;
      totalAmount = ratePerHour * roundedHours;
    }

    if (roundedHours === 0) {
      totalAmount = 0;
      discountAmount = ratePerHour;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    await this.repo.updateForExit(transaction.id, {
      exit_time: exitTime,
      duration_minutes: durationMinutes,
      rounded_hours: roundedHours,
      billing_mode: billingMode,
      rate_per_hour: ratePerHour,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      exit_operator_id: operatorId,
      status: "completed",
    });

    if (transaction.space_assigned) {
      await this.repo.releaseSpace(transaction.space_assigned);
    }

    let plate = "";
    try {
      plate = decryptPlateFromBuffer(transaction.plate_encrypted);
    } catch {
      plate = transaction.plate || "***";
    }

    return {
      transaction_id: transaction.transaction_id,
      plate,
      category: transaction.category,
      entry_time: transaction.entry_time,
      exit_time: exitTime,
      duration_minutes: durationMinutes,
      rounded_hours: roundedHours,
      billing_mode: billingMode,
      rate_per_hour: ratePerHour,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
    };
  }

  async getActiveTransactions(page: number, limit: number) {
    const result = await this.repo.findActiveTransactions(page, limit);

    const data = result.data.map((txn: { plate_encrypted: Uint8Array; plate: string | null; id: number; transaction_id: string; category: string; customer_name: string; entry_time: Date; space_assigned: string | null; billing_mode: string | null; tickets: Array<{ ticket_number: string; custody_terms_version: string | null }> | null }) => {
      let plate = "";
      try {
        plate = decryptPlateFromBuffer(txn.plate_encrypted);
      } catch {
        plate = txn.plate || "***";
      }
      return {
        id: txn.id,
        transaction_id: txn.transaction_id,
        plate,
        category: txn.category,
        customer_name: txn.customer_name,
        entry_time: txn.entry_time,
        space_assigned: txn.space_assigned,
        billing_mode: txn.billing_mode,
        ticket: txn.tickets?.[0] ?? null,
      };
    });

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async getTransaction(id: string) {
    let txn = await this.repo.findByTransactionId(id);
    if (!txn) {
      const plateHash = hashPlate(id.toUpperCase());
      txn = await this.repo.findByPlateHash(plateHash);
    }
    if (!txn) {
      throw AppError.notFound("Transaccion", id);
    }

    let plate = "";
    try {
      plate = decryptPlateFromBuffer(txn.plate_encrypted);
    } catch {
      plate = txn.plate || "***";
    }

    return {
      ...txn,
      plate,
      plate_encrypted: undefined,
    };
  }
}

export const transactionsService = new TransactionsService(transactionsRepository);
