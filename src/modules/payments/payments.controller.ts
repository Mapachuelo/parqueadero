import { FastifyRequest, FastifyReply } from "fastify";
import { paymentsService } from "./payments.service.js";

export async function processPayment(request: FastifyRequest, reply: FastifyReply) {
  const operatorId = request.user!.id;
  const data = request.body as {
    transactionId: string;
    paymentMethod: string;
    amountPaid: number;
    prepaidUsed: number;
  };

  const result = await paymentsService.processPayment(operatorId, data);

  return reply.send({ success: true, data: result });
}
