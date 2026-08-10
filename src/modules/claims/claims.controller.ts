import { FastifyRequest, FastifyReply } from "fastify";
import { claimsService } from "./claims.service.js";
import {
  createClaimSchema,
  updateClaimSchema,
  claimNoteSchema,
  claimEvidenceSchema,
  resolveClaimSchema,
} from "./claims.schema.js";

export async function createClaim(request: FastifyRequest, reply: FastifyReply) {
  const reporterId = request.user!.id;
  const body = createClaimSchema.parse(request.body);
  const data = await claimsService.createClaim(reporterId, body);
  return reply.send({ success: true, data });
}

export async function getClaims(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { status?: string; category?: string; page?: number; limit?: number };
  const data = await claimsService.getClaims(query);
  return reply.send({ success: true, data });
}

export async function getClaim(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await claimsService.getClaim(id);
  return reply.send({ success: true, data });
}

export async function updateClaim(request: FastifyRequest, reply: FastifyReply) {
  const adminId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = updateClaimSchema.parse(request.body);
  const data = await claimsService.updateClaim(adminId, id, body);
  return reply.send({ success: true, data });
}

export async function addEvidence(request: FastifyRequest, reply: FastifyReply) {
  const uploaderId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = claimEvidenceSchema.parse(request.body);
  const data = await claimsService.addEvidence(uploaderId, id, body);
  return reply.send({ success: true, data });
}

export async function addNote(request: FastifyRequest, reply: FastifyReply) {
  const authorId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = claimNoteSchema.parse(request.body);
  const data = await claimsService.addNote(authorId, id, body.content);
  return reply.send({ success: true, data });
}

export async function resolveClaim(request: FastifyRequest, reply: FastifyReply) {
  const adminId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = resolveClaimSchema.parse(request.body);
  const data = await claimsService.resolveClaim(adminId, id, body);
  return reply.send({ success: true, data });
}
