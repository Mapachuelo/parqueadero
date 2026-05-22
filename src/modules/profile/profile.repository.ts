import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ProfileRepository {
  async findUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        uuid: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        must_change_password: true,
        created_at: true,
        updated_at: true,
        last_login: true,
      },
    });
  }

  async findUserWithPassword(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        password_hash: true,
        password_history: true,
        must_change_password: true,
        role: true,
        is_active: true,
      },
    });
  }

  async updateUser(id: number, data: { full_name?: string; email?: string; phone?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        uuid: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async updatePassword(id: number, hashedPassword: string, passwordHistory: string) {
    return prisma.user.update({
      where: { id },
      data: {
        password_hash: hashedPassword,
        password_history: passwordHistory,
        must_change_password: false,
      },
    });
  }

  async findSessions(userId: number) {
    return prisma.userSession.findMany({
      where: { user_id: userId, is_active: true },
      select: {
        id: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        expires_at: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async invalidateSession(sessionId: number) {
    return prisma.userSession.update({
      where: { id: sessionId },
      data: { is_active: false },
    });
  }

  async invalidateAllOtherSessions(userId: number, currentSessionToken: string) {
    return prisma.userSession.updateMany({
      where: {
        user_id: userId,
        is_active: true,
        token: { not: currentSessionToken },
      },
      data: { is_active: false },
    });
  }

  async findSessionByToken(token: string) {
    return prisma.userSession.findUnique({
      where: { token },
    });
  }

  async findNotificationPreferences(userId: number) {
    return prisma.userNotificationPreference.findUnique({
      where: { user_id: userId },
    });
  }

  async updateNotificationPreferences(userId: number, data: Record<string, boolean>) {
    return prisma.userNotificationPreference.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data } as any,
      update: data,
    });
  }

  async exportUserData(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uuid: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        last_login: true,
      },
    });

    if (!user) return null;

    const [transactions, payments, sessions, preferences] = await Promise.all([
      prisma.vehicleTransaction.findMany({
        where: {
          OR: [
            { entry_operator_id: userId },
            { exit_operator_id: userId },
            ...(user.email ? [{ customer_email: user.email }] : []),
          ],
        },
        include: {
          payment: true,
          tickets: true,
        },
        orderBy: { entry_time: "desc" },
      }),
      prisma.payment.findMany({
        where: { operator_id: userId },
      }),
      prisma.userSession.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          ip_address: true,
          user_agent: true,
          created_at: true,
          expires_at: true,
          is_active: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.userNotificationPreference.findUnique({
        where: { user_id: userId },
      }),
    ]);

    return { user, transactions, payments, sessions, preferences };
  }
}

export const profileRepository = new ProfileRepository();
