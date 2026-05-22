import { PrismaClient } from "@prisma/client";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { sendMail } from "../shared/services/mail.service.js";

const prisma = new PrismaClient();

export async function runAutoReport(): Promise<void> {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const from = startOfDay(yesterday);
  const to = endOfDay(yesterday);

  const payments = await prisma.payment.findMany({
    where: {
      created_at: { gte: from, lte: to },
      status: "completed",
    },
    include: {
      transaction: {
        select: { category: true },
      },
    },
  });

  if (payments.length === 0) return;

  let totalRevenue = 0;
  const byCategory: Record<string, { count: number; total: number }> = {};
  const byMethod: Record<string, number> = {};

  for (const p of payments) {
    const amount = Number(p.amount_paid);
    totalRevenue += amount;

    const cat = p.transaction?.category || "sin_categoria";
    if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
    byCategory[cat].count++;
    byCategory[cat].total += amount;

    const method = p.payment_method;
    byMethod[method] = (byMethod[method] || 0) + amount;
  }

  const adminUsers = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true, full_name: true },
  });

  for (const admin of adminUsers) {
    if (!admin.email) continue;

    let html = `<h2>Reporte Diario de Ingresos</h2>`;
    html += `<p>Fecha: ${yesterday.toISOString().split("T")[0]}</p>`;
    html += `<p>Total de transacciones: ${payments.length}</p>`;
    html += `<p>Ingresos totales: $${totalRevenue.toLocaleString("es-CO")}</p>`;
    html += `<h3>Por Categoria</h3><ul>`;
    for (const [cat, data] of Object.entries(byCategory)) {
      html += `<li>Categoria ${cat}: ${data.count} transacciones - $${data.total.toLocaleString("es-CO")}</li>`;
    }
    html += `</ul><h3>Por Metodo de Pago</h3><ul>`;
    for (const [method, amount] of Object.entries(byMethod)) {
      html += `<li>${method}: $${amount.toLocaleString("es-CO")}</li>`;
    }
    html += `</ul><p>Parqueadero Publico Neiva</p>`;

    await sendMail({
      to: admin.email,
      subject: `Reporte diario de ingresos - ${yesterday.toISOString().split("T")[0]}`,
      html,
    }).catch(() => {});
  }
}
