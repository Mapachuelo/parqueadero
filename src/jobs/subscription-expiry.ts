import { PrismaClient } from "@prisma/client";
import { sendMail } from "../shared/services/mail.service.js";

const prisma = new PrismaClient();

export async function checkSubscriptionExpiry(): Promise<void> {
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

  const expiringSubscriptions = await prisma.monthlySubscription.findMany({
    where: {
      status: { in: ["activa"] },
      end_date: {
        lte: fiveDaysFromNow,
        gt: new Date(),
      },
    },
  });

  for (const sub of expiringSubscriptions) {
    const daysRemaining = Math.ceil(
      (sub.end_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await prisma.subscriptionNotification.create({
      data: {
        subscription_id: sub.id,
        message: `La mensualidad para la placa vence el ${sub.end_date.toISOString().split("T")[0]}`,
        days_remaining: daysRemaining,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: sub.registered_by ?? undefined },
      select: { email: true, full_name: true },
    });

    if (user?.email) {
      await sendMail({
        to: user.email,
        subject: "Vencimiento proximo de mensualidad - Parqueadero Neiva",
        text: `Hola ${user.full_name},\n\nTu mensualidad de parqueadero vence el ${sub.end_date.toISOString().split("T")[0]}. Renuevala para seguir disfrutando del servicio sin interrupcion.\n\nParqueadero Publico Neiva`,
      }).catch(() => {});
    }
  }
}
