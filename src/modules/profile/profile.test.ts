import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { ProfileService } from "./profile.service.js";

const mockRepo = {
  findUserById: vi.fn(),
  updateUser: vi.fn(),
  findUserWithPassword: vi.fn(),
  updatePassword: vi.fn(),
  invalidateAllOtherSessions: vi.fn(),
  findSessions: vi.fn(),
  invalidateSession: vi.fn(),
  findNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  exportUserData: vi.fn(),
};

const service = new ProfileService(mockRepo as any);

describe("ProfileService (RF-PERFIL-001..007)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getProfile lanza 404 si el usuario no existe", async () => {
    mockRepo.findUserById.mockResolvedValue(null);
    await expect(service.getProfile(99)).rejects.toThrow("Usuario no encontrado");
  });

  it("updateProfile mapea los campos a snake_case", async () => {
    mockRepo.findUserById.mockResolvedValue({ id: 1 });
    mockRepo.updateUser.mockResolvedValue({ id: 1, full_name: "Nuevo Nombre" });

    await service.updateProfile(1, { fullName: "Nuevo Nombre", phone: "3001234567" });

    expect(mockRepo.updateUser).toHaveBeenCalledWith(1, {
      full_name: "Nuevo Nombre",
      phone: "3001234567",
    });
  });

  it("changePassword rechaza contrasena actual incorrecta", async () => {
    const hash = await bcrypt.hash("Actual123!", 4);
    mockRepo.findUserWithPassword.mockResolvedValue({ id: 1, password_hash: hash, password_history: null });

    await expect(
      service.changePassword(1, "Incorrecta1!", "Nueva123!", "token")
    ).rejects.toThrow("contrasena actual es incorrecta");
  });

  it("changePassword rechaza reutilizar una contrasena previa", async () => {
    const currentHash = await bcrypt.hash("Actual123!", 4);
    const oldHash = await bcrypt.hash("Nueva123!", 4);
    mockRepo.findUserWithPassword.mockResolvedValue({
      id: 1,
      password_hash: currentHash,
      password_history: oldHash,
    });

    await expect(
      service.changePassword(1, "Actual123!", "Nueva123!", "token")
    ).rejects.toThrow("No puede reutilizar");
  });

  it("changePassword actualiza el hash y cierra otras sesiones", async () => {
    const currentHash = await bcrypt.hash("Actual123!", 4);
    mockRepo.findUserWithPassword.mockResolvedValue({
      id: 1,
      password_hash: currentHash,
      password_history: null,
    });
    mockRepo.updatePassword.mockResolvedValue({});
    mockRepo.invalidateAllOtherSessions.mockResolvedValue({ count: 1 });

    await service.changePassword(1, "Actual123!", "Nueva123!", "token-actual");

    expect(mockRepo.updatePassword).toHaveBeenCalled();
    expect(mockRepo.invalidateAllOtherSessions).toHaveBeenCalledWith(1, "token-actual");
  });

  it("getNotificationPreferences devuelve defaults si no hay registro", async () => {
    mockRepo.findNotificationPreferences.mockResolvedValue(null);
    const result = await service.getNotificationPreferences(1);
    expect(result.rate_changes).toBe(true);
    expect(result.sms_enabled).toBe(false);
  });

  it("updateNotificationPreferences traduce camelCase a snake_case", async () => {
    mockRepo.updateNotificationPreferences.mockResolvedValue({});
    await service.updateNotificationPreferences(1, { rateChanges: false, emailEnabled: true });
    expect(mockRepo.updateNotificationPreferences).toHaveBeenCalledWith(1, {
      rate_changes: false,
      email_enabled: true,
    });
  });

  it("exportUserData lanza 404 si no hay datos", async () => {
    mockRepo.exportUserData.mockResolvedValue(null);
    await expect(service.exportUserData(1)).rejects.toThrow("Usuario no encontrado");
  });

  it("closeSession lanza 404 si la sesion no existe", async () => {
    mockRepo.invalidateSession.mockResolvedValue(null);
    await expect(service.closeSession(1, 55)).rejects.toThrow(/Sesion no encontrad/);
  });
});
