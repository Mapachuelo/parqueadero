import { RatesRepository } from "./rates.repository.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashPlate, encryptPlateToBuffer, decryptPlateFromBuffer } from "../../shared/utils/crypto.js";
import { generateSubscriptionId, generateCreditId } from "../../shared/utils/ids.js";
import { addDays } from "../../shared/utils/date.js";

export class RatesService {
  private repository: RatesRepository;

  constructor(repository: RatesRepository) {
    this.repository = repository;
  }

  async createStructure(_adminId: number, data: { name: string; description?: string; effectiveDate?: string }) {
    return this.repository.createRateStructure({
      name: data.name,
      description: data.description,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
    });
  }

  async getStructures() {
    return this.repository.findAllRateStructures();
  }

  async getStructureById(id: number) {
    const structure = await this.repository.findRateStructureById(id);
    if (!structure) throw AppError.notFound("Estructura de tarifas");
    return structure;
  }

  async updateStructure(id: number, data: { name?: string; description?: string }) {
    const structure = await this.repository.findRateStructureById(id);
    if (!structure) throw AppError.notFound("Estructura de tarifas");
    return this.repository.updateRateStructure(id, data);
  }

  async activateStructure(id: number, effectiveDate?: string) {
    const structure = await this.repository.findRateStructureById(id);
    if (!structure) throw AppError.notFound("Estructura de tarifas");
    const date = effectiveDate ? new Date(effectiveDate) : new Date();
    return this.repository.activateStructure(id, date);
  }

  async createRate(data: {
    structureId: number;
    category: string;
    pricePerHour: number;
    description?: string;
    validFrom?: string;
    validTo?: string;
  }) {
    const structure = await this.repository.findRateStructureById(data.structureId);
    if (!structure) throw AppError.notFound("Estructura de tarifas");

    const validFrom = data.validFrom ? new Date(data.validFrom) : undefined;
    const validTo = data.validTo ? new Date(data.validTo) : undefined;

    const overlap = await this.repository.checkRateOverlap(
      data.category,
      data.structureId,
      validFrom,
      validTo
    );

    if (overlap) {
      throw AppError.conflict("Ya existe una tarifa activa para esta categoria que se solapa con el periodo indicado");
    }

    const existingActive = await this.repository.findActiveRateByCategory(data.category);
    const oldPrice = existingActive ? Number(existingActive.price_per_hour) : 0;

    const rate = await this.repository.createRate({
      structureId: data.structureId,
      category: data.category,
      pricePerHour: data.pricePerHour,
      description: data.description,
      validFrom,
      validTo,
    });

    await this.repository.createRateChangeHistory({
      rateId: rate.id,
      oldPrice,
      newPrice: data.pricePerHour,
      changedBy: undefined,
      changeReason: undefined,
    });

    return rate;
  }

  async getActiveRates() {
    return this.repository.findActiveRates();
  }

  async getRateHistory(rateId: number) {
    const structures = await this.repository.findAllRateStructures();
    const rate = structures
      .flatMap(({ rates }: { rates: { id: number }[] }) => rates)
      .find((r: { id: number }) => r.id === rateId);

    if (!rate) throw AppError.notFound("Tarifa");
    return this.repository.findRateHistory(rateId);
  }

  async createFractionRate(data: {
    structureId: number;
    category: string;
    minutes15: number;
    minutes30: number;
    minutes45: number;
  }) {
    const structure = await this.repository.findRateStructureById(data.structureId);
    if (!structure) throw AppError.notFound("Estructura de tarifas");

    return this.repository.createFractionRate(data);
  }

  async getFractionRates() {
    return this.repository.findAllFractionRates();
  }

  async createSubscription(operatorId: number, data: {
    plate: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    monthlyAmount: number;
    startDate?: string;
    autoRenew?: boolean;
    durationMonths?: number;
  }) {
    const durationMonths = data.durationMonths || 1;
    const plateHash = hashPlate(data.plate);
    const datePart = new Date().toISOString().slice(0, 7).replace("-", "");
    const maxSeq = await this.repository.getMaxSubscriptionSeq(datePart);
    const subscriptionId = generateSubscriptionId(maxSeq + 1);
    const plateEncrypted = encryptPlateToBuffer(data.plate);
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    endDate.setHours(23, 59, 59, 999);

    const subscription = await this.repository.createSubscription({
      subscriptionId,
      plateEncrypted,
      plateHash,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      monthlyAmount: data.monthlyAmount,
      startDate,
      endDate,
      autoRenew: data.autoRenew,
      registeredBy: operatorId,
    });

    return subscription;
  }

  async getSubscriptions(filters: {
    status?: string;
    plateHash?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await this.repository.findAllSubscriptions(filters);

    const data = result.data.map((sub: { plate_encrypted: Uint8Array; [key: string]: unknown }) => ({
      ...sub,
      plate_decrypted: decryptPlateFromBuffer(sub.plate_encrypted),
    }));

    return { ...result, data };
  }

  async renewSubscription(id: number, months: number) {
    const subscription = await this.repository.findSubscriptionById(id);
    if (!subscription) throw AppError.notFound("Suscripcion");

    const newEndDate = new Date(subscription.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + months);
    newEndDate.setHours(23, 59, 59, 999);

    return this.repository.updateSubscription(id, {
      endDate: newEndDate,
      status: "activa",
    });
  }

  async createCredit(operatorId: number, data: {
    plate: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    isHours?: boolean;
    expirationDate?: string;
  }) {
    const plateHash = hashPlate(data.plate);
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const maxSeq = await this.repository.getMaxCreditSeq(datePart);
    const creditId = generateCreditId(maxSeq + 1);

    const credit = await this.repository.createCredit({
      creditId,
      plateHash,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      balance: data.amount,
      originalAmount: data.amount,
      isHours: data.isHours,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
      purchasedBy: operatorId,
    });

    await this.repository.rechargeCredit(credit.id, 0);

    return credit;
  }

  async getCredits(filters: {
    status?: string;
    plateHash?: string;
    page?: number;
    limit?: number;
  }) {
    return this.repository.findAllCredits(filters);
  }

  async rechargeCredit(id: number, amount: number, _operatorId?: number) {
    const credit = await this.repository.findCreditById(id);
    if (!credit) throw AppError.notFound("Credito");
    if (amount <= 0) throw AppError.badRequest("El monto a recargar debe ser mayor a 0");

    return this.repository.rechargeCredit(id, amount);
  }
}

export const ratesService = new RatesService(new RatesRepository());
