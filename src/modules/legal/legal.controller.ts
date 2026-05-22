import { FastifyRequest, FastifyReply } from "fastify";
import { legalService } from "./legal.service.js";

export async function getCustodyTerms(request: FastifyRequest, reply: FastifyReply) {
  const data = await legalService.getCustodyTerms();
  return reply.send({ success: true, data });
}

export async function createCustodyTerms(request: FastifyRequest, reply: FastifyReply) {
  const adminId = request.user!.id;
  const body = request.body as { version: string; content: string };
  const data = await legalService.createCustodyTerms(adminId, body);
  return reply.send({ success: true, data });
}

export async function activateCustodyTerms(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await legalService.activateCustodyTerms(Number(id));
  return reply.send({ success: true, data });
}

export async function getChecklists(request: FastifyRequest, reply: FastifyReply) {
  const data = await legalService.getChecklists();
  return reply.send({ success: true, data });
}

export async function createChecklist(request: FastifyRequest, reply: FastifyReply) {
  const adminId = request.user!.id;
  const body = request.body as { name: string; description?: string };
  const data = await legalService.createChecklist(adminId, body);
  return reply.send({ success: true, data });
}

export async function getChecklist(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await legalService.getChecklist(Number(id));
  return reply.send({ success: true, data });
}

export async function updateChecklistItem(request: FastifyRequest, reply: FastifyReply) {
  const { itemId } = request.params as { itemId: string };
  const userId = request.user!.id;
  const body = request.body as { isChecked: boolean };
  const data = await legalService.updateChecklistItem(Number(itemId), body, userId);
  return reply.send({ success: true, data });
}

export async function completeChecklist(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await legalService.completeChecklist(Number(id));
  return reply.send({ success: true, data });
}

export async function checkLegalCompliance(request: FastifyRequest, reply: FastifyReply) {
  const data = await legalService.checkLegalCompliance();
  return reply.send({ success: true, data });
}
