import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { ClientService } from "./client.service.js";
import { encryptPlateToBuffer } from "../../shared/utils/crypto.js";

const mockRepo = {
  findUserByEmail: vi.fn(),
  findTransactionsByPlateHash: vi.fn(),
  findTransactionById: vi.fn(),
  findTransactionByIdAndPlate: vi.fn(),
  findTransactionsByCustomerEmail: vi.fn(),
  findUserEmail: vi.fn(),
  createClientSession: vi.fn(),
};

const service = new ClientService(mockRepo as any);

const plateBuffer = encryptPlateToBuffer("ABC-123");

function userWithPassword(password: string) {
  return {
    id: 3,
    username: "cliente1",
    email: "cliente@ejemplo.com",
    full_name: "Cliente Prueba",
    role: "cliente",
    is_active: true,
    password_hash: bcrypt.hashSync(password, 4),
    password_history: null,
  };
}

describe("ClientService (RF-CLIENTE-001)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exige datos de autenticacion", async () => {
    await expect(service.authenticateClient({})).rejects.toThrow("Debe proporcionar");
  });

  it("rechaza email desconocido", async () => {
    mockRepo.findUserByEmail.mockResolvedValue(null);
    await expect(
      service.authenticateClient({ email: "nadie@x.com", password: "x" })
    ).rejects.toThrow("Credenciales invalidas");
  });

  it("autentica por email y crea sesion", async () => {
    mockRepo.findUserByEmail.mockResolvedValue(userWithPassword("Cliente123!"));
    mockRepo.createClientSession.mockResolvedValue({});

    const result = await service.authenticateClient({
      email: "cliente@ejemplo.com",
      password: "Cliente123!",
    });

    expect(result.token).toBeTruthy();
    expect(result.user.role).toBe("cliente");
    expect(mockRepo.createClientSession).toHaveBeenCalled();
  });

  it("rechaza contrasena incorrecta", async () => {
    mockRepo.findUserByEmail.mockResolvedValue(userWithPassword("Cliente123!"));
    await expect(
      service.authenticateClient({ email: "cliente@ejemplo.com", password: "mala" })
    ).rejects.toThrow("Credenciales invalidas");
  });

  it("acceso por transaccion: 404 si no existe", async () => {
    mockRepo.findTransactionById.mockResolvedValue(null);
    await expect(
      service.authenticateClient({ transactionId: "TXN-NO", plateLast4: "C123" })
    ).rejects.toThrow(/Transaccion .*no encontrad/);
  });

  it("acceso por transaccion: valida los ultimos 4 caracteres", async () => {
    mockRepo.findTransactionById.mockResolvedValue({
      transaction_id: "TXN-20260927-00001",
      plate_encrypted: plateBuffer,
      plate: "ABC-123",
      customer_email: "cliente@ejemplo.com",
    });

    await expect(
      service.authenticateClient({ transactionId: "TXN-20260927-00001", plateLast4: "ZZZZ" })
    ).rejects.toThrow("no coinciden");
  });

  it("acceso por transaccion valido (C123) entrega token temporal", async () => {
    mockRepo.findTransactionById.mockResolvedValue({
      transaction_id: "TXN-20260927-00001",
      plate_encrypted: plateBuffer,
      plate: "ABC-123",
      customer_email: "cliente@ejemplo.com",
    });
    mockRepo.findUserByEmail.mockResolvedValue(userWithPassword("Cliente123!"));
    mockRepo.createClientSession.mockResolvedValue({});

    const result: any = await service.authenticateClient({
      transactionId: "TXN-20260927-00001",
      plateLast4: "C123",
    });

    expect(result.accessType).toBe("temporary");
    expect(result.transactionId).toBe("TXN-20260927-00001");
  });

  it("getClientTransaction prohibe transacciones de otro cliente", async () => {
    mockRepo.findTransactionById.mockResolvedValue({
      transaction_id: "TXN-1",
      customer_email: "otro@ejemplo.com",
      plate_encrypted: plateBuffer,
    });
    mockRepo.findUserEmail.mockResolvedValue("cliente@ejemplo.com");

    await expect(service.getClientTransaction(3, "TXN-1")).rejects.toThrow("No tiene acceso");
  });

  it("getClientTransactions por email descifra la placa", async () => {
    mockRepo.findUserEmail.mockResolvedValue("cliente@ejemplo.com");
    mockRepo.findTransactionsByCustomerEmail.mockResolvedValue({
      data: [{ id: 1, transaction_id: "TXN-1", plate_encrypted: plateBuffer, plate: null }],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.getClientTransactions(3, {
      filters: { page: 1, limit: 10 },
    });

    expect(result.data[0].plate).toBe("ABC-123");
  });

  it("getClientTransactions temporal devuelve solo la transaccion del token", async () => {
    mockRepo.findTransactionById.mockResolvedValue({
      id: 1,
      transaction_id: "TXN-1",
      plate_encrypted: plateBuffer,
      plate: null,
    });

    const result = await service.getClientTransactions(3, {
      filters: { page: 1, limit: 10 },
      accessType: "temporary",
      scopedTransactionId: "TXN-1",
    });

    expect(result.total).toBe(1);
    expect(result.data[0].transaction_id).toBe("TXN-1");
  });

  it("acceso por transaccion exige cuenta de cliente asociada", async () => {
    mockRepo.findTransactionById.mockResolvedValue({
      transaction_id: "TXN-1",
      plate_encrypted: plateBuffer,
      plate: "ABC-123",
      customer_email: null,
    });

    await expect(
      service.authenticateClient({ transactionId: "TXN-1", plateLast4: "C123" })
    ).rejects.toThrow("cuenta de cliente asociada");
  });

  it("getClientTransaction devuelve la transaccion propia", async () => {
    mockRepo.findTransactionById.mockResolvedValue({
      transaction_id: "TXN-1",
      customer_email: "cliente@ejemplo.com",
      plate_encrypted: plateBuffer,
      plate: null,
    });
    mockRepo.findUserEmail.mockResolvedValue("cliente@ejemplo.com");

    const result = await service.getClientTransaction(3, "TXN-1");
    expect(result.plate).toBe("ABC-123");
  });

  it("getClientTransaction temporal rechaza otra transaccion", async () => {
    await expect(
      service.getClientTransaction(3, "TXN-OTRA", {
        accessType: "temporary",
        scopedTransactionId: "TXN-1",
      })
    ).rejects.toThrow("No tiene acceso");
  });

  it("getClientTransactions por placa usa findTransactionsByPlateHash", async () => {
    mockRepo.findTransactionsByPlateHash.mockResolvedValue({
      data: [{ id: 1, transaction_id: "TXN-1", plate_encrypted: plateBuffer, plate: null }],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.getClientTransactions(3, {
      plateHash: "hash",
      filters: { page: 1, limit: 10 },
    });

    expect(result.data[0].plate).toBe("ABC-123");
    expect(mockRepo.findTransactionsByPlateHash).toHaveBeenCalled();
  });
});
