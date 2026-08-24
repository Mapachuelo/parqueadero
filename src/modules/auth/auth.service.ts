import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository.js";
import { Role as PrismaRole } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { env } from "../../config/env.js";
import { addMinutes } from "../../shared/utils/date.js";
import { BCRYPT_ROUNDS } from "../../shared/utils/security.js";

export class AuthService {
  private repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  async login(
    identifier: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await this.repository.findByUsernameOrEmail(identifier);

    if (!user) {
      throw AppError.unauthorized("Credenciales invalidas");
    }

    if (user.locked_until && user.locked_until > new Date()) {
      throw AppError.locked();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const updated = await this.repository.updateFailedAttempts(user.id);

      if (updated.failed_login_attempts >= 3) {
        const lockUntil = addMinutes(new Date(), 30);
        await this.repository.lockAccount(user.id, lockUntil);
        throw AppError.locked();
      }

      throw AppError.unauthorized("Credenciales invalidas");
    }

    await this.repository.resetFailedAttempts(user.id);
    await this.repository.updateLastLogin(user.id);

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: `${env.JWT_EXPIRATION_MINUTES}m` }
    );

    const expiresAt = addMinutes(new Date(), env.JWT_EXPIRATION_MINUTES);

    await this.repository.createSession(user.id, token, expiresAt, ipAddress, userAgent);

    const { password_hash, password_history, ...safeUser } = user;

    return { token, user: safeUser };
  }

  async logout(token: string) {
    await this.repository.invalidateSession(token);
  }

  async validateSession(token: string) {
    const session = await this.repository.findSessionByToken(token);

    if (!session || !session.is_active || session.expires_at <= new Date()) {
      throw AppError.unauthorized();
    }

    const user = await this.repository.findUserById(session.user_id);

    if (!user || !user.is_active) {
      throw AppError.unauthorized();
    }

    const { password_hash, password_history, ...safeUser } = user;

    return safeUser;
  }

  async register(
    adminUserId: number,
    userData: {
      username: string;
      password: string;
      full_name: string;
      email: string;
      phone?: string;
      role: PrismaRole;
    }
  ) {
    const admin = await this.repository.findUserById(adminUserId);

    if (!admin || admin.role !== "admin" || !admin.is_active) {
      throw AppError.forbidden();
    }

    const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

    const user = await this.repository.createUser({
      username: userData.username,
      password_hash: passwordHash,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      must_change_password: true,
      is_active: true,
    });

    const { password_hash, password_history, ...safeUser } = user;

    return safeUser;
  }
}

export const authService = new AuthService(
  new AuthRepository()
);
