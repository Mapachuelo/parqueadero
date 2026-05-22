import { z } from "zod";

export const paymentSchema = z.object({
  transactionId: z.string().min(1),
  paymentMethod: z.enum([
    "efectivo",
    "tarjeta_credito",
    "tarjeta_debito",
    "transferencia",
    "billetera_digital",
    "abono",
  ]),
  amountPaid: z.coerce.number().min(0),
  prepaidUsed: z.coerce.number().optional().default(0),
});
