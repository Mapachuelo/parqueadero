import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService } from "./auth.service.js";

const mockRepo = {
  findByUsernameOrEmail: vi.fn(),
  findUserById: vi.fn(),
  findSessionByToken: vi.fn(),
  createSession: vi.fn(),
  invalidateSession: vi.fn(),
  invalidateAllSessions: vi.fn(),
  createUser: vi.fn(),
  updateFailedAttempts: vi.fn(),
  lockAccount: vi.fn(),
  resetFailedAttempts: vi.fn(),
  updateLastLogin: vi.fn(),
  updatePassword: vi.fn(),
  findAllUsers: vi.fn(),
};

const service = new AuthService(mockRepo as any);

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    username: "admin",
    email: "admin@parqueadero.com",
    full_name: "Administrador",
    role: "admin",
    is_active: true,
    password_hash: bcrypt.hashSync("Admin123!", 4),
    password_history: null,
    locked_until: null,
    failed_login_attempts: 0,
    ...overrides,
  };
}

describe("AuthService (RF-ACCESO-001/002/003)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("login exitoso devuelve token y usuario sin hash", async () => {
    mockRepo.findByUsernameOrEmail.mockResolvedValue(makeUser());
    mockRepo.resetFailedAttempts.mockResolvedValue({});
    mockRepo.updateLastLogin.mockResolvedValue({});
    mockRepo.createSession.mockResolvedValue({});

    const result = await service.login("admin", "Admin123!");

    expect(result.token).toBeTruthy();
    expect(result.user).not.toHaveProperty("password_hash");
    expect(mockRepo.createSession).toHaveBeenCalled();
  });

  it("rechaza usuario desconocido", async () => {
    mockRepo.findByUsernameOrEmail.mockResolvedValue(null);
    await expect(service.login("nadie", "x")).rejects.toThrow("Credenciales invalidas");
  });

  it("rechaza contrasena incorrecta e incrementa intentos", async () => {
    mockRepo.findByUsernameOrEmail.mockResolvedValue(makeUser());
    mockRepo.updateFailedAttempts.mockResolvedValue({ failed_login_attempts: 1 });

    await expect(service.login("admin", "mala")).rejects.toThrow("Credenciales invalidas");
    expect(mockRepo.updateFailedAttempts).toHaveBeenCalledWith(1);
  });

  it("bloquea la cuenta al tercer intento fallido", async () => {
    mockRepo.findByUsernameOrEmail.mockResolvedValue(makeUser());
    mockRepo.updateFailedAttempts.mockResolvedValue({ failed_login_attempts: 3 });
    mockRepo.lockAccount.mockResolvedValue({});

    await expect(service.login("admin", "mala")).rejects.toThrow("Cuenta bloqueada");
    expect(mockRepo.lockAccount).toHaveBeenCalled();
  });

  it("rechaza cuenta bloqueada vigente", async () => {
    const future = new Date(Date.now() + 600000);
    mockRepo.findByUsernameOrEmail.mockResolvedValue(makeUser({ locked_until: future }));

    await expect(service.login("admin", "Admin123!")).rejects.toThrow("Cuenta bloqueada");
  });

  it("validateSession rechaza sesion inexistente", async () => {
    mockRepo.findSessionByToken.mockResolvedValue(null);
    await expect(service.validateSession("token")).rejects.toThrow("Sesion invalida");
  });

  it("validateSession devuelve el usuario activo", async () => {
    mockRepo.findSessionByToken.mockResolvedValue({
      is_active: true,
      expires_at: new Date(Date.now() + 600000),
      user_id: 1,
    });
    mockRepo.findUserById.mockResolvedValue(makeUser());

    const user = await service.validateSession("token");
    expect(user.username).toBe("admin");
  });

  it("register exige que el solicitante sea admin", async () => {
    mockRepo.findUserById.mockResolvedValue(makeUser({ role: "operador" }));
    await expect(
      service.register(2, {
        username: "nuevo",
        password: "Clave123!",
        full_name: "Nuevo",
        email: "nuevo@parqueadero.com",
        role: "operador",
      })
    ).rejects.toThrow("No tiene permisos");
  });

  it("register crea usuario cuando el solicitante es admin", async () => {
    mockRepo.findUserById.mockResolvedValue(makeUser());
    mockRepo.createUser.mockResolvedValue(makeUser({ id: 4, role: "cliente", username: "cliente1" }));

    const user = await service.register(1, {
      username: "cliente1",
      password: "Clave123!",
      full_name: "Cliente",
      email: "cliente@ejemplo.com",
      role: "cliente",
    });

    expect(user).not.toHaveProperty("password_hash");
    expect(mockRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "cliente", must_change_password: true })
    );
  });

  it("listUsers delega al repositorio", async () => {
    mockRepo.findAllUsers.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const users = await service.listUsers();
    expect(users).toHaveLength(2);
  });
});
