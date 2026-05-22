import { FastifyRequest, FastifyReply } from "fastify";
import { transactionsService } from "./transactions.service.js";
import { entrySchema, exitSchema, activeQuerySchema } from "./transactions.schema.js";

export async function entry(request: FastifyRequest, reply: FastifyReply) {
  const body = entrySchema.parse(request.body);
  const operatorId = request.user!.id;

  const result = await transactionsService.registerEntry(operatorId, body);

  return reply.status(201).send({ success: true, data: result });
}

export async function exit(request: FastifyRequest, reply: FastifyReply) {
  const body = exitSchema.parse(request.body);
  const operatorId = request.user!.id;
  const params = request.params as { id: string };

  const identifier = {
    transactionId: body.transactionId || params.id,
    plate: body.plate,
  };

  if (!identifier.transactionId && !identifier.plate) {
    const result = await transactionsService.registerExit(operatorId, {
      transactionId: params.id,
    });
    return reply.send({ success: true, data: result });
  }

  const result = await transactionsService.registerExit(operatorId, identifier);

  return reply.send({ success: true, data: result });
}

export async function active(request: FastifyRequest, reply: FastifyReply) {
  const query = activeQuerySchema.parse(request.query);

  const result = await transactionsService.getActiveTransactions(query.page, query.limit);

  return reply.send({ success: true, data: result });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };

  const result = await transactionsService.getTransaction(params.id);

  return reply.send({ success: true, data: result });
}
