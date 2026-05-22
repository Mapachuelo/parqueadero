import { PrismaClient } from "@prisma/client";
import { sendMail } from "../shared/services/mail.service.js";

const prisma = new PrismaClient();

export async function checkCreditLowBalance(): Promise<void> {
  const credits = await prisma.prepaidCredit.findMany({
    where: {
      is_active: true,
    },
  });

  for (const credit of credits) {
    const totalPaid = await prisma.prepaidMovement.aggregate({
      where: { credit_id: credit.id, type: "RECARGA" },
      _sum: { amount: true },
    });

    const totalUsed = await prisma.prepaidMovement.aggregate({
      where: { credit_id: credit.id, type: "CONSUMO" },
      _sum: { amount: true },
    });

    const paid = Number(totalPaid._sum?.amount ?? 0);
    const used = Number(totalUsed._sum?.amount ?? 0);
    const remaining = paid - used;
    const percentage = paid > 0 ? (remaining / paid) * 100 : 0;

    if (percentage <= 20 && remaining > 0) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const alreadyNotified = await prisma.creditNotification.findFirst({
        where: {
          credit_id: credit.id,
          created_at: { gte: yesterday },
        },
      });

      if (!alreadyNotified) {
        await prisma.creditNotification.create({
          data: {
            credit_id: credit.id,
            message: `Tu saldo de abono es de $${remaining.toLocaleString("es-CO")} (${percentage.toFixed(0)}%). Recarga para continuar usando el servicio.`,
            percentage: remaining,
          },
        });

        const user = await prisma.user.findUnique({
          where: { id: credit.purchased_by ?? undefined },
          select: { email: true, full_name: true },
        });

        if (user?.email) {
          await sendMail({
            to: user.email,
            subject: "Saldo bajo de abono - Parqueadero Neiva",
            text: `Hola ${user.full_name},\n\nTu saldo de abono es de $${remaining.toLocaleString("es-CO")} (${percentage.toFixed(0)}% restante). Recarga para continuar usando el servicio sin interrupcion.\n\nParqueadero Publico Neiva`,
          }).catch(() => {});
        }
      }
    }
  }
}
