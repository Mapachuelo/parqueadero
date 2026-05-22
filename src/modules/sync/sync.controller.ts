import { FastifyRequest, FastifyReply } from "fastify";
import { syncService } from "./sync.service.js";
import { syncPayloadSchema, resolveConflictSchema } from "./sync.schema.js";

export async function receiveBatch(request: FastifyRequest, reply: FastifyReply) {
  const body = syncPayloadSchema.parse(request.body);

  const result = await syncService.receiveBatch(body.deviceId, {
    transactions: body.transactions,
    payments: body.payments,
  });

  return reply.send({ success: true, data: result });
}

export async function getStatus(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { deviceId?: string };

  const result = await syncService.getSyncStatus(query.deviceId);

  return reply.send({ success: true, data: result });
}

export async function getConflicts(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: string; limit?: string };
  const page = parseInt(query.page ?? "1", 10);
  const limit = parseInt(query.limit ?? "20", 10);

  const result = await syncService.getConflicts(page, limit);

  return reply.send({ success: true, data: result });
}

export async function resolveConflict(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const body = resolveConflictSchema.parse(request.body);
  const adminId = request.user!.id;

  const result = await syncService.resolveConflict(
    adminId,
    parseInt(params.id, 10),
    body
  );

  return reply.send({ success: true, data: result });
}

export async function getRates(request: FastifyRequest, reply: FastifyReply) {
  const result = await syncService.getRatesForDevice();

  return reply.send({ success: true, data: result });
}

export async function getUsers(request: FastifyRequest, reply: FastifyReply) {
  const result = await syncService.getUsersForDevice();

  return reply.send({ success: true, data: result });
}

export async function getSubscriptions(request: FastifyRequest, reply: FastifyReply) {
  const result = await syncService.getSubscriptionsForDevice();

  return reply.send({ success: true, data: result });
}

export async function getCredits(request: FastifyRequest, reply: FastifyReply) {
  const result = await syncService.getCreditsForDevice();

  return reply.send({ success: true, data: result });
}
