import { FastifyRequest, FastifyReply } from "fastify";
import { ratesService } from "./rates.service.js";
import {
  rateStructureSchema,
  rateSchema,
  fractionRateSchema,
  subscriptionSchema,
  creditSchema,
  rechargeSchema,
} from "./rates.schema.js";

export async function createStructure(request: FastifyRequest, reply: FastifyReply) {
  const body = rateStructureSchema.parse(request.body);
  const result = await ratesService.createStructure(request.user!.id, body);
  return reply.status(201).send({ success: true, data: result });
}

export async function getStructures(request: FastifyRequest, reply: FastifyReply) {
  const result = await ratesService.getStructures();
  return reply.send({ success: true, data: result });
}

export async function getStructureById(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const result = await ratesService.getStructureById(Number(params.id));
  return reply.send({ success: true, data: result });
}

export async function updateStructure(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const body = rateStructureSchema.partial().parse(request.body);
  const result = await ratesService.updateStructure(Number(params.id), body);
  return reply.send({ success: true, data: result });
}

export async function activateStructure(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const body = request.body as { effectiveDate?: string } | undefined;
  const result = await ratesService.activateStructure(Number(params.id), body?.effectiveDate);
  return reply.send({ success: true, data: result });
}

export async function createRate(request: FastifyRequest, reply: FastifyReply) {
  const body = rateSchema.parse(request.body);
  const result = await ratesService.createRate(body);
  return reply.status(201).send({ success: true, data: result });
}

export async function getActiveRates(request: FastifyRequest, reply: FastifyReply) {
  const result = await ratesService.getActiveRates();
  return reply.send({ success: true, data: result });
}

export async function getRateHistory(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const result = await ratesService.getRateHistory(Number(params.id));
  return reply.send({ success: true, data: result });
}

export async function createFractionRate(request: FastifyRequest, reply: FastifyReply) {
  const body = fractionRateSchema.parse(request.body);
  const result = await ratesService.createFractionRate(body);
  return reply.status(201).send({ success: true, data: result });
}

export async function getFractionRates(request: FastifyRequest, reply: FastifyReply) {
  const result = await ratesService.getFractionRates();
  return reply.send({ success: true, data: result });
}

export async function createSubscription(request: FastifyRequest, reply: FastifyReply) {
  const body = subscriptionSchema.parse(request.body);
  const result = await ratesService.createSubscription(request.user!.id, body);
  return reply.status(201).send({ success: true, data: result });
}

export async function getSubscriptions(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { status?: string; plateHash?: string; page?: string; limit?: string };
  const result = await ratesService.getSubscriptions({
    status: query.status,
    plateHash: query.plateHash,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  });
  return reply.send({ success: true, data: result });
}

export async function renewSubscription(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const body = request.body as { months: number };
  const result = await ratesService.renewSubscription(Number(params.id), body.months);
  return reply.send({ success: true, data: result });
}

export async function createCredit(request: FastifyRequest, reply: FastifyReply) {
  const body = creditSchema.parse(request.body);
  const result = await ratesService.createCredit(request.user!.id, body);
  return reply.status(201).send({ success: true, data: result });
}

export async function getCredits(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { status?: string; plateHash?: string; page?: string; limit?: string };
  const result = await ratesService.getCredits({
    status: query.status,
    plateHash: query.plateHash,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  });
  return reply.send({ success: true, data: result });
}

export async function rechargeCredit(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { id: string };
  const body = rechargeSchema.parse(request.body);
  const result = await ratesService.rechargeCredit(Number(params.id), body.amount, request.user!.id);
  return reply.send({ success: true, data: result });
}
