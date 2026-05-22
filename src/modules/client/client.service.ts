import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../shared/errors/app-error.js";
import { env } from "../../config/env.js";
import { addMinutes } from "../../shared/utils/date.js";
import { decryptPlateFromBuffer } from "../../shared/utils/crypto.js";
import { ClientRepository } from "./client.repository.js";

export class ClientService {
  constructor(private repo: ClientRepository) {}

  async authenticateClient(data: {
    email?: string;
    password?: string;
    transactionId?: string;
    plateLast4?: string;
  }) {
    if (data.email && data.password) {
      return this.authenticateByEmail(data.email, data.password);
    }

    if (data.transactionId && data.plateLast4) {
      return this.authenticateByTransaction(data.transactionId, data.plateLast4);
    }

    throw AppError.badRequest(
      "Debe proporcionar correo y contrasena, o identificador de transaccion y ultimos 4 digitos de placa"
    );
  }

  private async authenticateByEmail(email: string, password: string) {
    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      throw AppError.unauthorized("Credenciales invalidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Credenciales invalidas");
    }

    const expiresInMinutes = 20;
    const token = jwt.sign(
      { sub: user.id, role: "cliente" },
      env.JWT_SECRET,
      { expiresIn: `${expiresInMinutes}m` }
    );

    const expiresAt = addMinutes(new Date(), expiresInMinutes);
    await this.repo.createClientSession(user.id, token, expiresAt);

    const { password_hash, password_history, ...safeUser } = user;

    return { token, user: safeUser };
  }

  private async authenticateByTransaction(transactionId: string, plateLast4: string) {
    const transaction = await this.repo.findTransactionById(transactionId);
    if (!transaction) {
      throw AppError.notFound("Transaccion", transactionId);
    }

    let plate = "";
    try {
      plate = decryptPlateFromBuffer(transaction.plate_encrypted);
    } catch {
      plate = transaction.plate || "";
    }

    if (plate.length < 4 || plate.slice(-4) !== plateLast4.toUpperCase()) {
      throw AppError.badRequest("Los ultimos 4 digitos de la placa no coinciden con la transaccion");
    }

    const user = transaction.customer_email
      ? await this.repo.findUserByEmail(transaction.customer_email)
      : null;

    if (!user) {
      throw AppError.badRequest(
        "No se encontro una cuenta de cliente asociada a esta transaccion. Inicie sesion con su correo y contrasena."
      );
    }

    const expiresInMinutes = 20;
    const token = jwt.sign(
      { sub: user.id, role: "cliente", accessType: "temporary", transactionId },
      env.JWT_SECRET,
      { expiresIn: `${expiresInMinutes}m` }
    );

    const expiresAt = addMinutes(new Date(), expiresInMinutes);
    await this.repo.createClientSession(user.id, token, expiresAt);

    const { password_hash, password_history, ...safeUser } = user;

    return { token, accessType: "temporary", transactionId, user: safeUser };
  }

  async getClientTransactions(
    userId: number,
    options: {
      plateHash?: string;
      filters: { page: number; limit: number; from?: string; to?: string };
      accessType?: string;
      scopedTransactionId?: string;
    }
  ) {
    const { plateHash, filters, accessType, scopedTransactionId } = options;

    const fromDate = filters.from ? new Date(filters.from) : undefined;
    const toDate = filters.to ? new Date(filters.to) : undefined;
    const dateFilters = { page: filters.page, limit: filters.limit, from: fromDate, to: toDate };

    if (accessType === "temporary" && scopedTransactionId) {
      const txn = await this.repo.findTransactionById(scopedTransactionId);
      if (!txn) {
        throw AppError.notFound("Transaccion", scopedTransactionId);
      }
      const result = [txn].map((t) => this.formatTransaction(t));
      return { data: result, total: result.length, page: 1, limit: 1 };
    }

    if (plateHash) {
      return this.findAndFormatByPlateHash(plateHash, dateFilters);
    }

    const email = await this.repo.findUserEmail(userId);
    if (!email) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const result = await this.repo.findTransactionsByCustomerEmail(email, dateFilters);
    return {
      data: result.data.map((t: any) => this.formatTransaction(t)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async getClientTransaction(
    userId: number,
    transactionId: string,
    options?: {
      accessType?: string;
      scopedTransactionId?: string;
    }
  ) {
    if (options?.accessType === "temporary" && options?.scopedTransactionId) {
      if (transactionId !== options.scopedTransactionId) {
        throw AppError.forbidden("No tiene acceso a esta transaccion");
      }
    }

    const transaction = await this.repo.findTransactionById(transactionId);
    if (!transaction) {
      throw AppError.notFound("Transaccion", transactionId);
    }

    if (options?.accessType !== "temporary") {
      const email = await this.repo.findUserEmail(userId);
      if (!email || transaction.customer_email !== email) {
        throw AppError.forbidden("No tiene acceso a esta transaccion");
      }
    }

    return this.formatTransaction(transaction);
  }

  private async findAndFormatByPlateHash(
    plateHash: string,
    filters: { page: number; limit: number; from?: Date; to?: Date }
  ) {
    const result = await this.repo.findTransactionsByPlateHash(plateHash, filters);
    return {
      data: result.data.map((t: any) => this.formatTransaction(t)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  private formatTransaction(txn: any) {
    let plate = "";
    try {
      plate = decryptPlateFromBuffer(txn.plate_encrypted);
    } catch {
      plate = txn.plate || "***";
    }

    const { plate_encrypted, ...rest } = txn;
    return { ...rest, plate };
  }
}

export const clientService = new ClientService(new ClientRepository());
