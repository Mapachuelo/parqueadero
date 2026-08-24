import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionsService } from "./transactions.service.js";
import { BillingMode } from "../../shared/types/enums.js";

const mockRepo = {
  findActiveByPlateHash: vi.fn(),
  findActiveByTransactionId: vi.fn(),
  findByTransactionId: vi.fn(),
  findByPlateHash: vi.fn(),
  findById: vi.fn(),
  findActiveTransactions: vi.fn(),
  getMaxSequenceForDate: vi.fn(),
  createTransaction: vi.fn(),
  assignSpace: vi.fn(),
  releaseSpace: vi.fn(),
  createTicket: vi.fn(),
  updateForExit: vi.fn(),
  findAllTransactions: vi.fn(),
  findActiveSubscription: vi.fn(),
  findActivePrepaidCredit: vi.fn(),
  findActiveRate: vi.fn(),
  findActiveFractionRate: vi.fn(),
  getActiveCustodyTermsVersion: vi.fn(),
  countAvailableSpaces: vi.fn(),
};

const service = new TransactionsService(mockRepo as any);

describe("TransactionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerEntry", () => {
    it("RF-RECEP-001: registra entrada con placa colombiana valida", async () => {
      mockRepo.findActiveByPlateHash.mockResolvedValue(null);
      mockRepo.getMaxSequenceForDate.mockResolvedValue(0);
      mockRepo.countAvailableSpaces.mockResolvedValue(5);
      mockRepo.assignSpace.mockResolvedValue({ space_code: "A-001" });
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.createTransaction.mockResolvedValue({
        id: 1,
        transaction_id: "TXN-20260803-00001",
        entry_time: new Date(),
        space_assigned: "A-001",
        plate_hash: "abc",
        billing_mode: null,
        status: "active",
        plate_encrypted: Buffer.from("mock"),
        category: "A",
        customer_name: "Test",
        customer_phone: null,
        is_international: false,
        country_origin: null,
        vehicle_description: null,
      });
      mockRepo.getActiveCustodyTermsVersion.mockResolvedValue("1.0");
      mockRepo.createTicket.mockResolvedValue({
        id: 1,
        ticket_number: "TKT-20260803-ABC123",
        custody_terms_version: "1.0",
        transaction_id: 1,
        ticket_type: "entrada",
        print_count: 1,
        created_at: new Date(),
      });

      const result = await service.registerEntry(1, {
        plate: "ABC-123",
        category: "A",
        customerName: "Test",
      });

      expect(result.transaction_id).toMatch(/^TXN-\d{8}-\d{5}$/);
      expect(result.space_assigned).toBe("A-001");
      expect(result.ticket.custody_terms_version).toBe("1.0");
      expect(mockRepo.findActiveByPlateHash).toHaveBeenCalled();
    });

    it("RF-RECEP-002: rechaza placa con formato invalido", async () => {
      await expect(
        service.registerEntry(1, {
          plate: "X",
          category: "A",
          customerName: "Test",
        })
      ).rejects.toThrow("Formato de placa invalido");
    });

    it("RF-RECEP-001: rechaza placa duplicada activa", async () => {
      mockRepo.findActiveByPlateHash.mockResolvedValue({
        id: 1,
        status: "active",
        plate_hash: "abc",
        plate_encrypted: Buffer.from("x"),
        transaction_id: "TXN-1",
        entry_time: new Date(),
      });

      await expect(
        service.registerEntry(1, {
          plate: "ABC-123",
          category: "A",
          customerName: "Test",
        })
      ).rejects.toThrow("ya tiene una entrada activa");
    });

    it("RF-RECEP-005: registra placa internacional con datos adicionales", async () => {
      mockRepo.findActiveByPlateHash.mockResolvedValue(null);
      mockRepo.getMaxSequenceForDate.mockResolvedValue(0);
      mockRepo.countAvailableSpaces.mockResolvedValue(5);
      mockRepo.assignSpace.mockResolvedValue({ space_code: "A-002" });
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.createTransaction.mockResolvedValue({
        id: 2,
        transaction_id: "TXN-20260803-00002",
        entry_time: new Date(),
        space_assigned: "A-002",
        plate_hash: "xyz",
        billing_mode: null,
        status: "active",
        plate_encrypted: Buffer.from("mock"),
        category: "B",
        customer_name: "Turista",
        customer_phone: null,
        is_international: true,
        country_origin: "Brasil",
        vehicle_description: "Chevrolet Onix",
      });
      mockRepo.getActiveCustodyTermsVersion.mockResolvedValue("1.0");
      mockRepo.createTicket.mockResolvedValue({
        id: 2,
        ticket_number: "TKT-INTL",
        custody_terms_version: "1.0",
        transaction_id: 2,
        ticket_type: "entrada",
        print_count: 1,
        created_at: new Date(),
      });

      const result = await service.registerEntry(1, {
        plate: "BR-8821",
        category: "B",
        customerName: "Turista",
        isInternational: true,
        countryOrigin: "Brasil",
        vehicleDescription: "Chevrolet Onix",
      });

      expect(result.transaction_id).toMatch(/^TXN-\d{8}-\d{5}$/);
      expect(result.space_assigned).toBe("A-002");
      expect(mockRepo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          is_international: true,
          country_origin: "Brasil",
        })
      );
    });

    it("RF-ESPACIO-001: asigna espacio automaticamente", async () => {
      mockRepo.findActiveByPlateHash.mockResolvedValue(null);
      mockRepo.getMaxSequenceForDate.mockResolvedValue(0);
      mockRepo.countAvailableSpaces.mockResolvedValue(3);
      mockRepo.assignSpace.mockResolvedValue({ space_code: "A-005" });
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.createTransaction.mockResolvedValue({
        id: 3, transaction_id: "TXN-3", entry_time: new Date(),
        space_assigned: "A-005", plate_hash: "zzz", billing_mode: null,
        status: "active", plate_encrypted: Buffer.from("m"),
        category: "A", customer_name: "T", customer_phone: null,
        is_international: false, country_origin: null, vehicle_description: null,
      });
      mockRepo.getActiveCustodyTermsVersion.mockResolvedValue("1.0");
      mockRepo.createTicket.mockResolvedValue({
        id: 3, ticket_number: "TKT-3", custody_terms_version: "1.0",
        transaction_id: 3, ticket_type: "entrada", print_count: 1, created_at: new Date(),
      });

      const result = await service.registerEntry(1, {
        plate: "ZZZ-101",
        category: "A",
        customerName: "Test",
      });

      expect(result.space_assigned).toBe("A-005");
    });
  });

  describe("registerExit", () => {
    const activeTx = {
      id: 1,
      transaction_id: "TXN-20260803-00001",
      entry_time: new Date("2026-08-03T08:00:00Z"),
      plate_hash: "abc",
      plate_encrypted: Buffer.from("mock"),
      plate: "ABC-123",
      category: "A",
      status: "active",
      billing_mode: null,
      space_assigned: "A-001",
      customer_name: "Test",
      customer_phone: null,
      is_international: false,
      country_origin: null,
      vehicle_description: null,
      exit_time: null,
      final_amount: null,
      rounded_hours: null,
      duration_minutes: null,
      rate_per_hour: 0,
      total_amount: 0,
      discount_amount: 0,
      exit_operator_id: null,
    };

    it("RF-SALIDA-001: calcula salida por transaction_id", async () => {
      mockRepo.findActiveByTransactionId.mockResolvedValue(activeTx);
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.findActivePrepaidCredit.mockResolvedValue(null);
      mockRepo.findActiveRate.mockResolvedValue({ id: 1, price_per_hour: 5000 });
      mockRepo.updateForExit.mockResolvedValue({});

      const result = await service.registerExit(1, {
        transactionId: "TXN-20260803-00001",
      });

      expect(result.transaction_id).toBe("TXN-20260803-00001");
      expect(result.billing_mode).toBe(BillingMode.HORA);
      expect(result.rate_per_hour).toBe(5000);
      expect(mockRepo.updateForExit).toHaveBeenCalledWith(1, expect.objectContaining({
        exit_operator_id: 1,
        status: "completed",
      }));
      expect(mockRepo.releaseSpace).toHaveBeenCalledWith("A-001");
    });

    it("RF-SALIDA-002: primeros 15 minutos gratis (redondeo 0)", async () => {
      const freshTx = { ...activeTx, entry_time: new Date() };
      mockRepo.findActiveByTransactionId.mockResolvedValue(freshTx);
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.findActivePrepaidCredit.mockResolvedValue(null);
      mockRepo.findActiveRate.mockResolvedValue({ id: 1, price_per_hour: 5000 });
      mockRepo.updateForExit.mockResolvedValue({});

      const result = await service.registerExit(1, {
        transactionId: "TXN-20260803-00001",
      });

      expect(result.rounded_hours).toBe(0);
      expect(result.final_amount).toBe(0);
      expect(result.discount_amount).toBe(5000);
    });

    it("RF-SALIDA-001: busca por placa cuando falla transaction_id", async () => {
      mockRepo.findActiveByTransactionId.mockResolvedValue(null);
      mockRepo.findActiveByPlateHash.mockResolvedValue(activeTx);
      mockRepo.findActiveSubscription.mockResolvedValue(null);
      mockRepo.findActivePrepaidCredit.mockResolvedValue(null);
      mockRepo.findActiveRate.mockResolvedValue({ id: 1, price_per_hour: 5000 });
      mockRepo.updateForExit.mockResolvedValue({});

      const result = await service.registerExit(1, {
        transactionId: "ABC-123",
      });

      expect(result.transaction_id).toBe("TXN-20260803-00001");
      expect(mockRepo.findActiveByPlateHash).toHaveBeenCalled();
    });

    it("lanza NOT_FOUND cuando no hay transaccion activa", async () => {
      mockRepo.findActiveByTransactionId.mockResolvedValue(null);
      mockRepo.findActiveByPlateHash.mockResolvedValue(null);

      await expect(
        service.registerExit(1, { transactionId: "NOPE" })
      ).rejects.toThrow("Transaccion activa no encontrada");
    });

    it("aplica mensualidad activa: final_amount 0", async () => {
      mockRepo.findActiveByTransactionId.mockResolvedValue(activeTx);
      mockRepo.findActiveSubscription.mockResolvedValue({ id: 1, status: "activa" });
      mockRepo.findActivePrepaidCredit.mockResolvedValue(null);
      mockRepo.updateForExit.mockResolvedValue({});

      const result = await service.registerExit(1, {
        transactionId: "TXN-20260803-00001",
      });

      expect(result.billing_mode).toBe(BillingMode.MENSUALIDAD);
      expect(result.final_amount).toBe(0);
    });
  });
});
