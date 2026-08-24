import bcrypt from "bcryptjs";
import { AppError } from "../../shared/errors/app-error.js";
import { ProfileRepository } from "./profile.repository.js";
import { BCRYPT_ROUNDS } from "../../shared/utils/security.js";

export class ProfileService {
  constructor(private repo: ProfileRepository) {}

  async getProfile(userId: number) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw AppError.notFound("Usuario");
    }
    return user;
  }

  async updateProfile(
    userId: number,
    data: { fullName?: string; email?: string; phone?: string }
  ) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw AppError.notFound("Usuario");
    }

    const updateData: { full_name?: string; email?: string; phone?: string } = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;

    return this.repo.updateUser(userId, updateData);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    sessionToken: string
  ) {
    const user = await this.repo.findUserWithPassword(userId);
    if (!user) {
      throw AppError.notFound("Usuario");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw AppError.badRequest("La contrasena actual es incorrecta");
    }

    const passwordHistory = user.password_history
      ? user.password_history.split(",").filter(Boolean)
      : [];

    for (const oldHash of passwordHistory) {
      const reused = await bcrypt.compare(newPassword, oldHash);
      if (reused) {
        throw AppError.badRequest("No puede reutilizar sus ultimas 5 contrasenas");
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const updatedHistory = [hashedPassword, ...passwordHistory].slice(0, 5);
    const historyString = updatedHistory.join(",");

    await this.repo.updatePassword(userId, hashedPassword, historyString);
    await this.repo.invalidateAllOtherSessions(userId, sessionToken);
  }

  async getSessions(userId: number) {
    const sessions = await this.repo.findSessions(userId);
    return sessions;
  }

  async closeSession(userId: number, sessionId: number) {
    const session = await this.repo.invalidateSession(sessionId);
    if (!session) {
      throw AppError.notFound("Sesion");
    }
  }

  async closeOtherSessions(userId: number, currentToken: string) {
    await this.repo.invalidateAllOtherSessions(userId, currentToken);
  }

  async getNotificationPreferences(userId: number) {
    const preferences = await this.repo.findNotificationPreferences(userId);
    if (!preferences) {
      const defaults = {
        rate_changes: true,
        occupancy_alerts: true,
        system_errors: true,
        sync_failures: true,
        claims: true,
        unauthorized_access: true,
        daily_summary: false,
        printer_offline: true,
        payment_failures: true,
        session_expiring: true,
        email_enabled: true,
        push_enabled: false,
        sms_enabled: false,
      };
      return defaults;
    }
    return preferences;
  }

  async updateNotificationPreferences(
    userId: number,
    data: Record<string, boolean>
  ) {
    const dbData: Record<string, boolean> = {};

    if (data.rateChanges !== undefined) dbData.rate_changes = data.rateChanges;
    if (data.occupancyAlerts !== undefined) dbData.occupancy_alerts = data.occupancyAlerts;
    if (data.systemErrors !== undefined) dbData.system_errors = data.systemErrors;
    if (data.syncFailures !== undefined) dbData.sync_failures = data.syncFailures;
    if (data.claims !== undefined) dbData.claims = data.claims;
    if (data.unauthorizedAccess !== undefined) dbData.unauthorized_access = data.unauthorizedAccess;
    if (data.dailySummary !== undefined) dbData.daily_summary = data.dailySummary;
    if (data.printerOffline !== undefined) dbData.printer_offline = data.printerOffline;
    if (data.paymentFailures !== undefined) dbData.payment_failures = data.paymentFailures;
    if (data.sessionExpiring !== undefined) dbData.session_expiring = data.sessionExpiring;
    if (data.emailEnabled !== undefined) dbData.email_enabled = data.emailEnabled;
    if (data.pushEnabled !== undefined) dbData.push_enabled = data.pushEnabled;
    if (data.smsEnabled !== undefined) dbData.sms_enabled = data.smsEnabled;

    return this.repo.updateNotificationPreferences(userId, dbData);
  }

  async exportUserData(userId: number) {
    const data = await this.repo.exportUserData(userId);
    if (!data) {
      throw AppError.notFound("Usuario");
    }
    return data;
  }
}

export const profileService = new ProfileService(new ProfileRepository());
