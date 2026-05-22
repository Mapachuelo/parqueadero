import { PrismaClient, Prisma, Role as PrismaRole } from "@prisma/client";

const prisma = new PrismaClient();

export class AuthRepository {
  async findByUsernameOrEmail(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
  }

  async findUserById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findSessionByToken(token: string) {
    return prisma.userSession.findUnique({ where: { token } });
  }

  async createSession(
    userId: number,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ) {
    return prisma.userSession.create({
      data: {
        user_id: userId,
        token,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  }

  async invalidateSession(token: string) {
    return prisma.userSession.update({
      where: { token },
      data: { is_active: false },
    });
  }

  async invalidateAllSessions(userId: number, exceptToken?: string) {
    return prisma.userSession.updateMany({
      where: {
        user_id: userId,
        is_active: true,
        ...(exceptToken ? { token: { not: exceptToken } } : {}),
      },
      data: { is_active: false },
    });
  }

  async createUser(data: {
    username: string;
    password_hash: string;
    full_name: string;
    email: string;
    phone?: string;
    role: PrismaRole;
    must_change_password?: boolean;
    is_active?: boolean;
  }) {
    return prisma.user.create({ data });
  }

  async updateFailedAttempts(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { failed_login_attempts: { increment: 1 } },
    });
  }

  async lockAccount(userId: number, until: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { locked_until: until },
    });
  }

  async resetFailedAttempts(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { failed_login_attempts: 0, locked_until: null },
    });
  }

  async updateLastLogin(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { last_login: new Date() },
    });
  }

  async updatePassword(userId: number, hashedPassword: string, history: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        password_history: history,
        must_change_password: false,
      },
    });
  }

  async findAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        must_change_password: true,
        created_at: true,
        last_login: true,
      },
    });
  }
}

export const authRepository = new AuthRepository();
